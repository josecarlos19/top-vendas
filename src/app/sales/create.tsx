import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSaleDatabase } from '@/database/models/Sale';
import { useCustomerDatabase } from '@/database/models/Customer';
import { useProductDatabase } from '@/database/models/Product';
import { Input } from '@/components/Input';
import formatCurrency from '@/components/utils/formatCurrency';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTime } from 'luxon';
import WorkArea from '@/components/WorkArea';
import SearchableSelect from '@/components/SearchableSelect';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface Product {
  id: number;
  name: string;
  sale_price: number;
  initial_stock: number;
  current_stock?: number;
  barcode?: string;
}

interface SaleItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'installment', label: 'Parcelado' },
];

export default function CreateSale() {
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | undefined>('cash');
  const [installments, setInstallments] = useState('1');
  const [saleDate, setSaleDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [firstDueDate, setFirstDueDate] = useState(new Date());
  const [firstDueDatePlusOneMonth, setFirstDueDatePlusOneMonth] = useState(
    DateTime.now().plus({ months: 1 }).toJSDate()
  );
  const [showFirstDuePicker, setShowFirstDuePicker] = useState(false);
  const [showSaleDatePicker, setShowSalePicker] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | undefined>();
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
  const [markAsCompleted, setMarkAsCompleted] = useState(false);

  const saleDatabase = useSaleDatabase();
  const customerDatabase = useCustomerDatabase();
  const productDatabase = useProductDatabase();

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (paymentMethod === 'installment') {
      const nextMonth = new Date(saleDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setFirstDueDate(nextMonth);
      setMarkAsCompleted(false);
    } else {
      setFirstDueDate(saleDate);
    }
  }, [paymentMethod, saleDate]);

  const loadCustomers = async () => {
    try {
      const customersData = await customerDatabase.index();
      setCustomers(
        customersData.map(customer => ({
          id: customer.id!,
          name: customer.name!,
          email: customer.email,
          phone: customer.phone,
        }))
      );
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await productDatabase.index({ active: 1 });
      setProducts(
        productsData.map(product => ({
          id: product.id!,
          name: product.name!,
          sale_price: product.sale_price!,
          initial_stock: product.initial_stock!,
          current_stock: product.current_stock,
          barcode: product.barcode,
        }))
      );
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const formatNumber = (text: string) => {
    return text.replace(/\D/g, '');
  };

  const getCurrencyValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getDiscountValue = () => {
    return getCurrencyValue(discount) * 100;
  };

  const getTotal = () => {
    return Math.max(0, getSubtotal() - getDiscountValue());
  };

  const addProductToSale = (productId: number | string) => {
    const product = products.find(p => p.id === Number(productId));
    if (!product) return;

    const availableStock = product.current_stock ?? 0;

    if (availableStock <= 0) {
      Alert.alert('Estoque insuficiente', 'Este produto não possui estoque disponível.');
      return;
    }

    const existingItem = items.find(item => item.product_id === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;

      if (newQuantity > availableStock) {
        Alert.alert(
          'Estoque insuficiente',
          `Apenas ${availableStock} unidade${availableStock > 1 ? 's' : ''} disponível${availableStock > 1 ? 'eis' : ''} para este produto.`
        );
        return;
      }

      updateItemQuantity(product.id, newQuantity);
    } else {
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.sale_price,
        subtotal: product.sale_price,
      };
      setItems([...items, newItem]);
    }
  };

  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity < 0) {
      return;
    }

    const product = products.find(p => p.id === productId);
    const availableStock = product?.current_stock ?? 0;

    if (newQuantity > availableStock) {
      Alert.alert(
        'Estoque insuficiente',
        `Este produto possui apenas ${availableStock} unidade${availableStock !== 1 ? 's' : ''} em estoque.`
      );
      return;
    }

    setItems(
      items.map(item =>
        item.product_id === productId
          ? {
            ...item,
            quantity: newQuantity,
            subtotal: newQuantity * item.unit_price,
          }
          : item
      )
    );
  };

  const updateItemPrice = (productId: number, newPrice: number) => {
    setItems(
      items.map(item =>
        item.product_id === productId
          ? {
            ...item,
            unit_price: newPrice,
            subtotal: item.quantity * newPrice,
          }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(item => item.product_id !== productId));
  };

  const validateForm = () => {
    if (items.length === 0) {
      Alert.alert('Erro', 'Adicione pelo menos um produto à venda.');
      return false;
    }

    if (getTotal() <= 0) {
      Alert.alert('Erro', 'O total da venda deve ser maior que zero.');
      return false;
    }

    if (!paymentMethod) {
      Alert.alert('Erro', 'Selecione uma forma de pagamento.');
      return false;
    }

    if (paymentMethod === 'installment' && parseInt(installments) <= 1) {
      Alert.alert(
        'Erro',
        'Para pagamento parcelado, informe mais de 1 parcela.'
      );
      return false;
    }

    return true;
  };

  const handleStore = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const subtotal = getSubtotal();
      const discountValue = getDiscountValue();
      const total = getTotal();
      const installmentCount =
        paymentMethod === 'installment' ? parseInt(installments) : 1;

      await saleDatabase.store({
        customer_id: customerId as number,
        subtotal,
        discount: discountValue,
        total,
        payment_method: paymentMethod as any,
        installments: installmentCount,
        status: markAsCompleted && paymentMethod !== 'installment' ? 'completed' : 'pending',
        sale_date: saleDate,
        notes: notes.trim() || undefined,
        itens: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
        first_due_date: firstDueDate,
        payment_date: markAsCompleted ? paymentDate : undefined,
      });

      Alert.alert('Sucesso', 'Venda criada com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error creating sale:', error);
      Alert.alert('Erro', 'Falha ao criar venda. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges =
      items.length > 0 || discount.trim() || notes.trim() || customerId;

    if (hasChanges) {
      Alert.alert(
        'Descartar alterações?',
        'Você tem alterações não salvas. Deseja realmente sair?',
        [
          { text: 'Continuar editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const isFormValid = items.length > 0 && getTotal() > 0;

  const customerOptions = customers.map(customer => ({
    label: customer.name,
    value: customer.id,
  }));

  const productOptions = products.map(product => {
    const availableStock = product.current_stock ?? 0;
    const isOutOfStock = availableStock <= 0;
    const isLowStock = availableStock > 0 && availableStock <= 5;

    return {
      label: product.name,
      value: product.id,
      disabled: isOutOfStock,
      metadata: {
        subtitle: formatCurrency(product.sale_price.toString()),
        badge: {
          text: isOutOfStock
            ? 'Sem Estoque'
            : `${availableStock} em estoque`,
          variant: isOutOfStock
            ? 'danger' as const
            : isLowStock
              ? 'warning' as const
              : 'success' as const,
        },
      },
    };
  });

  const renderSaleItem = ({ item }: { item: SaleItem }) => (
    <View style={styles.saleItem}>
      <View style={styles.saleItemHeader}>
        <Text style={styles.saleItemName}>{item.product_name}</Text>
        <TouchableOpacity
          style={styles.removeItemButton}
          onPress={() => removeItem(item.product_id)}
        >
          <Ionicons name='close' size={16} color='#ef4444' />
        </TouchableOpacity>
      </View>

      <View style={styles.saleItemDetails}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              updateItemQuantity(item.product_id, item.quantity - 1)
            }
          >
            <Ionicons name='remove' size={16} color='#64748b' />
          </TouchableOpacity>
          <Input
            value={item.quantity.toString()}
            onChangeText={text => {
              const value = parseInt(text.replace(/\D/g, ''), 10) || 0;
              updateItemQuantity(item.product_id, value);
            }}
            onBlur={() => {
              if (item.quantity === 0) {
                removeItem(item.product_id);
              }
            }}
            keyboardType='numeric'
            style={[styles.quantityText]}
            editable={true}
          />
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              updateItemQuantity(item.product_id, item.quantity + 1)
            }
          >
            <Ionicons name='add' size={16} color='#64748b' />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.unitPrice}>
            {formatCurrency(item.unit_price.toString())}
          </Text>
          <Text style={styles.subtotal}>
            {formatCurrency(item.subtotal.toString())}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <WorkArea>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='receipt-outline' size={48} color='#FF6B35' />
          </View>
          <Text style={styles.title}>Nova Venda</Text>
          <Text style={styles.subtitle}>Registre uma nova venda no sistema</Text>
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Ionicons name='person-outline' size={20} color='#FF6B35' />
            <Text style={styles.sectionTitle}>Cliente</Text>
          </View>

          <SearchableSelect
            selectedValue={customerId}
            onValueChange={value => setCustomerId(value as number)}
            options={customerOptions}
            enabled={!isLoading}
            placeholder='Selecione um cliente'
          />

          <View style={styles.sectionHeader}>
            <Ionicons name='bag-outline' size={20} color='#FF6B35' />
            <Text style={styles.sectionTitle}>Produtos</Text>
          </View>

          <SearchableSelect
            selectedValue={undefined}
            onValueChange={addProductToSale}
            options={productOptions}
            enabled={!isLoading}
            placeholder='Buscar produto ou código de barras...'
          />

          {items.length > 0 && (
            <View style={styles.itemsList}>
              <FlatList
                data={items}
                renderItem={renderSaleItem}
                keyExtractor={item => item.product_id.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Pagamento */}
          <View style={styles.sectionHeader}>
            <Ionicons name='card-outline' size={20} color='#FF6B35' />
            <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
          </View>

          <SearchableSelect
            selectedValue={paymentMethod}
            onValueChange={value => setPaymentMethod(value as string)}
            options={PAYMENT_METHODS}
            enabled={!isLoading}
          />

          {paymentMethod === 'installment' && (
            <>
              {/* Parcelamento */}
              <View style={styles.sectionHeader}>
                <Ionicons name='wallet-outline' size={20} color='#FF6B35' />
                <Text style={styles.sectionTitle}>Parcelamento</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Número de Parcelas</Text>
                <Input
                  placeholder='Número de parcelas'
                  value={installments}
                  onChangeText={text => setInstallments(formatNumber(text))}
                  editable={!isLoading}
                  style={styles.input}
                  keyboardType='numeric'
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data do Primeiro Vencimento</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setShowFirstDuePicker(true)}
                  disabled={isLoading}
                >
                  <Text style={styles.selectorText}>
                    {firstDueDate.toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name='calendar-outline' size={20} color='#64748b' />
                </TouchableOpacity>

                {showFirstDuePicker && (
                  <DateTimePicker
                    value={firstDueDate}
                    mode='date'
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, date) => {
                      setShowFirstDuePicker(false);
                      if (date) setFirstDueDate(date);
                    }}
                  />
                )}
              </View>
            </>
          )}

          {/* Data da Venda */}
          <View style={styles.sectionHeader}>
            <Ionicons name='calendar-outline' size={20} color='#FF6B35' />
            <Text style={styles.sectionTitle}>Data da Venda</Text>
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowSalePicker(true)}
              disabled={isLoading}
            >
              <Text style={styles.selectorText}>
                {saleDate.toLocaleDateString('pt-BR')}
              </Text>
              <Ionicons name='calendar-outline' size={20} color='#64748b' />
            </TouchableOpacity>

            {showSaleDatePicker && (
              <DateTimePicker
                value={saleDate}
                mode='date'
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowSalePicker(false);
                  if (date) setSaleDate(date);
                }}
              />
            )}
          </View>

          <View style={[styles.inputGroup, styles.inputGroupCompact]}>
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Ionicons name='checkmark-circle-outline' size={20} color='#22c55e' />
                <Text style={styles.label}>Marcar como Concluída</Text>
              </View>
              <Switch
                value={markAsCompleted}
                onValueChange={(value) => {
                  setMarkAsCompleted(value);
                  if (value && !paymentDate) {
                    setPaymentDate(new Date());
                  }
                }}
                trackColor={{ false: '#cbd5e1', true: '#86efac' }}
                thumbColor={markAsCompleted ? '#22c55e' : '#f1f5f9'}
                disabled={isLoading || paymentMethod === 'installment'}
              />
            </View>

            {paymentMethod === 'installment' && (
              <View style={styles.infoCard}>
                <Ionicons name='information-circle' size={20} color='#3b82f6' />
                <Text style={styles.infoText}>
                  Para vendas parceladas, a conclusão ocorre quando todas as parcelas são pagas.
                </Text>
              </View>
            )}

            {markAsCompleted && (
              <View style={styles.paymentDateContainer}>
                <Text style={styles.subLabel}>Data do Pagamento</Text>
                <TouchableOpacity
                  style={styles.selector}
                  onPress={() => setShowPaymentDatePicker(true)}
                  disabled={isLoading}
                >
                  <Text style={styles.selectorText}>
                    {(paymentDate || new Date()).toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name='calendar-outline' size={20} color='#64748b' />
                </TouchableOpacity>

                {showPaymentDatePicker && (
                  <DateTimePicker
                    value={paymentDate || new Date()}
                    mode='date'
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, date) => {
                      setShowPaymentDatePicker(false);
                      if (date) setPaymentDate(date);
                    }}
                  />
                )}
              </View>
            )}
          </View>

          {/* Desconto e Resumo */}
          <View style={styles.sectionHeader}>
            <Ionicons name='pricetag-outline' size={20} color='#FF6B35' />
            <Text style={styles.sectionTitle}>Desconto e Resumo</Text>
          </View>

          <View style={styles.inputGroup}>
            <Input
              placeholder='R$ 0,00'
              value={discount}
              onChangeText={text => setDiscount(formatCurrency(text))}
              editable={!isLoading}
              style={styles.input}
              keyboardType='numeric'
            />
          </View>

          {/* Resumo */}
          {items.length > 0 && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(getSubtotal().toString())}
                </Text>
              </View>
              {getDiscountValue() > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Desconto:</Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    -{formatCurrency(getDiscountValue().toString())}
                  </Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(getTotal().toString())}
                </Text>
              </View>
            </View>
          )}

          {/* Observações */}
          <View style={styles.sectionHeader}>
            <Ionicons name='document-text-outline' size={20} color='#FF6B35' />
            <Text style={styles.sectionTitle}>Observações</Text>
          </View>

          <View style={styles.inputGroup}>
            <Input
              placeholder='Informações adicionais sobre a venda (opcional)'
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              editable={!isLoading}
              style={[styles.input, styles.textArea]}
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid || isLoading) && styles.saveButtonDisabled,
            ]}
            onPress={handleStore}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size='small' color='#ffffff' />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons name='checkmark-outline' size={16} color='#ffffff' />
                <Text style={styles.saveButtonText}>Registrar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </WorkArea>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupCompact: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentDateContainer: {
    marginTop: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#1e293b',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 250,
  },
  searchInput: {
    margin: 8,
    marginBottom: 0,
  },
  optionsList: {
    maxHeight: 200,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  optionDisabledText: {
    color: '#94a3b8',
  },
  productOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  productStock: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  stockEmpty: {
    color: '#ef4444',
  },
  addProductButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  addProductText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  itemsList: {
    marginTop: 16,
  },
  saleItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  saleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  removeItemButton: {
    padding: 4,
  },
  saleItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quantityButton: {
    width: 35,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#c2c7cdff',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginHorizontal: 16,
    minWidth: 42,
    height: 42,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 10,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    fontSize: 14,
    color: '#64748b',
  },
  subtotal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  discountValue: {
    color: '#ef4444',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
