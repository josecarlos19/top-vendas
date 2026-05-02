import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
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

type Step = 1 | 2 | 3 | 4;

export default function CreateSaleWizard() {
  // Controle de steps
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Dados da venda
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

  const removeItem = (productId: number) => {
    setItems(items.filter(item => item.product_id !== productId));
  };

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!customerId) {
          Alert.alert('Atenção', 'Por favor, selecione um cliente antes de continuar.');
          return false;
        }
        return true;

      case 2:
        if (items.length === 0) {
          Alert.alert('Atenção', 'Por favor, adicione pelo menos um produto antes de continuar.');
          return false;
        }
        return true;

      case 3:
        if (getTotal() <= 0) {
          Alert.alert('Atenção', 'O total da venda deve ser maior que zero.');
          return false;
        }
        return true;

      case 4:
        if (!paymentMethod) {
          Alert.alert('Atenção', 'Por favor, selecione uma forma de pagamento.');
          return false;
        }
        if (paymentMethod === 'installment' && parseInt(installments) <= 1) {
          Alert.alert('Atenção', 'Para pagamento parcelado, informe mais de 1 parcela.');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(4, prev + 1) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
  };

  const handleFinish = async () => {
    if (!validateStep(currentStep)) return;

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
          <Ionicons name='close' size={20} color='#ef4444' />
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
            <Ionicons name='remove' size={20} color='#64748b' />
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
            <Ionicons name='add' size={20} color='#64748b' />
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

  const getStepIcon = (step: Step) => {
    switch (step) {
      case 1:
        return 'person-outline';
      case 2:
        return 'bag-outline';
      case 3:
        return 'calculator-outline';
      case 4:
        return 'card-outline';
    }
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
      case 1:
        return 'Selecionar Cliente';
      case 2:
        return 'Adicionar Produtos';
      case 3:
        return 'Valores e Desconto';
      case 4:
        return 'Finalizar Venda';
    }
  };

  const getStepDescription = (step: Step) => {
    switch (step) {
      case 1:
        return 'Escolha o cliente para esta venda';
      case 2:
        return 'Adicione os produtos e quantidades';
      case 3:
        return 'Confira os valores e aplique desconto se necessário';
      case 4:
        return 'Defina a forma de pagamento e finalize';
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cliente *</Text>
              <SearchableSelect
                selectedValue={customerId}
                onValueChange={value => setCustomerId(value as number)}
                options={customerOptions}
                enabled={!isLoading}
                placeholder='Selecione um cliente'
              />
            </View>

            {customerId && (
              <View style={styles.successCard}>
                <Ionicons name='checkmark-circle' size={24} color='#22c55e' />
                <Text style={styles.successText}>
                  Cliente selecionado! Clique em "Próximo" para continuar.
                </Text>
              </View>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Buscar Produto *</Text>
              <SearchableSelect
                selectedValue={undefined}
                onValueChange={addProductToSale}
                options={productOptions}
                enabled={!isLoading}
                placeholder='Buscar produto ou código de barras...'
              />
            </View>

            {items.length > 0 && (
              <View style={styles.itemsList}>
                <Text style={styles.itemsListTitle}>Produtos Adicionados ({items.length})</Text>
                <FlatList
                  data={items}
                  renderItem={renderSaleItem}
                  keyExtractor={item => item.product_id.toString()}
                  scrollEnabled={false}
                />
              </View>
            )}

            {items.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name='cube-outline' size={48} color='#94a3b8' />
                <Text style={styles.emptyText}>Nenhum produto adicionado</Text>
                <Text style={styles.emptySubtext}>
                  Use a busca acima para adicionar produtos à venda
                </Text>
              </View>
            )}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Desconto (opcional)</Text>
              <Input
                placeholder='R$ 0,00'
                value={discount}
                onChangeText={text => setDiscount(formatCurrency(text))}
                editable={!isLoading}
                style={styles.input}
                keyboardType='numeric'
              />
            </View>

            {items.length > 0 && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Resumo da Venda</Text>

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
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Forma de Pagamento *</Text>
              <SearchableSelect
                selectedValue={paymentMethod}
                onValueChange={value => setPaymentMethod(value as string)}
                options={PAYMENT_METHODS}
                enabled={!isLoading}
              />
            </View>

            {paymentMethod === 'installment' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Número de Parcelas *</Text>
                  <Input
                    placeholder='Ex: 3'
                    value={installments}
                    onChangeText={text => setInstallments(formatNumber(text))}
                    editable={!isLoading}
                    style={styles.input}
                    keyboardType='numeric'
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Data da Primeira Parcela *</Text>
                  <TouchableOpacity
                    style={styles.selector}
                    onPress={() => setShowFirstDuePicker(true)}
                    disabled={isLoading}
                  >
                    <Text style={styles.selectorText}>
                      {firstDueDate.toLocaleDateString('pt-BR')}
                    </Text>
                    <Ionicons name='calendar-outline' size={24} color='#64748b' />
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

                <View style={styles.infoCard}>
                  <Ionicons name='information-circle' size={20} color='#3b82f6' />
                  <Text style={styles.infoText}>
                    Para vendas parceladas, a conclusão ocorre quando todas as parcelas são pagas.
                  </Text>
                </View>
              </>
            )}

            {(paymentMethod === 'cash' || paymentMethod === 'pix') && (
              <>
                <View style={styles.inputGroup}>
                  <View style={styles.switchContainer}>
                    <View style={styles.switchLabelContainer}>
                      <Ionicons name='checkmark-circle-outline' size={24} color='#22c55e' />
                      <Text style={styles.label}>Já foi pago?</Text>
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
                      disabled={isLoading}
                    />
                  </View>
                </View>

                {markAsCompleted && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Data do Pagamento</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowPaymentDatePicker(true)}
                      disabled={isLoading}
                    >
                      <Text style={styles.selectorText}>
                        {(paymentDate || new Date()).toLocaleDateString('pt-BR')}
                      </Text>
                      <Ionicons name='calendar-outline' size={24} color='#64748b' />
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

                {!markAsCompleted && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Data de Vencimento</Text>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowFirstDuePicker(true)}
                      disabled={isLoading}
                    >
                      <Text style={styles.selectorText}>
                        {firstDueDate.toLocaleDateString('pt-BR')}
                      </Text>
                      <Ionicons name='calendar-outline' size={24} color='#64748b' />
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
                )}
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data da Venda</Text>
              <TouchableOpacity
                style={styles.selector}
                onPress={() => setShowSalePicker(true)}
                disabled={isLoading}
              >
                <Text style={styles.selectorText}>
                  {saleDate.toLocaleDateString('pt-BR')}
                </Text>
                <Ionicons name='calendar-outline' size={24} color='#64748b' />
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observações (opcional)</Text>
              <Input
                placeholder='Informações adicionais sobre a venda'
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                editable={!isLoading}
                style={[styles.input, styles.textArea]}
              />
            </View>

            {/* Resumo Final */}
            <View style={styles.finalSummaryContainer}>
              <Text style={styles.finalSummaryTitle}>Resumo Final</Text>

              <View style={styles.finalSummaryRow}>
                <Ionicons name='person' size={20} color='#64748b' />
                <Text style={styles.finalSummaryLabel}>Cliente:</Text>
                <Text style={styles.finalSummaryValue}>
                  {customers.find(c => c.id === customerId)?.name || '-'}
                </Text>
              </View>

              <View style={styles.finalSummaryRow}>
                <Ionicons name='cube' size={20} color='#64748b' />
                <Text style={styles.finalSummaryLabel}>Produtos:</Text>
                <Text style={styles.finalSummaryValue}>{items.length} item(s)</Text>
              </View>

              <View style={styles.finalSummaryRow}>
                <Ionicons name='cash' size={20} color='#64748b' />
                <Text style={styles.finalSummaryLabel}>Total:</Text>
                <Text style={[styles.finalSummaryValue, styles.finalSummaryTotal]}>
                  {formatCurrency(getTotal().toString())}
                </Text>
              </View>

              <View style={styles.finalSummaryRow}>
                <Ionicons name='card' size={20} color='#64748b' />
                <Text style={styles.finalSummaryLabel}>Pagamento:</Text>
                <Text style={styles.finalSummaryValue}>
                  {PAYMENT_METHODS.find(p => p.value === paymentMethod)?.label || '-'}
                </Text>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <WorkArea>
        {/* Header com progresso */}
        <View style={styles.headerSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(currentStep / 4) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Etapa {currentStep} de 4
            </Text>
          </View>

          <View style={styles.iconContainer}>
            <Ionicons name={getStepIcon(currentStep)} size={48} color='#FF6B35' />
          </View>

          <Text style={styles.title}>{getStepTitle(currentStep)}</Text>
          <Text style={styles.subtitle}>{getStepDescription(currentStep)}</Text>
        </View>

        {/* Conteúdo do step atual */}
        {renderStepContent()}

        {/* Botões de navegação */}
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={isLoading}
            >
              <Ionicons name='arrow-back' size={20} color='#64748b' />
              <Text style={styles.backButtonText}>Voltar</Text>
            </TouchableOpacity>
          )}

          {currentStep < 4 ? (
            <TouchableOpacity
              style={[styles.nextButton, currentStep === 1 && styles.nextButtonFull]}
              onPress={handleNext}
              disabled={isLoading}
            >
              <Text style={styles.nextButtonText}>Próximo</Text>
              <Ionicons name='arrow-forward' size={20} color='#ffffff' />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinish}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size='small' color='#ffffff' />
                  <Text style={styles.finishButtonText}>Finalizando...</Text>
                </>
              ) : (
                <>
                  <Ionicons name='checkmark-circle' size={20} color='#ffffff' />
                  <Text style={styles.finishButtonText}>Finalizar Venda</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Botão cancelar */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </WorkArea>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  stepContent: {
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 15,
    color: '#1e293b',
  },
  successCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#86efac',
    gap: 10,
  },
  successText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    textAlign: 'center',
  },
  itemsList: {
    marginTop: 8,
  },
  itemsListTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  saleItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  saleItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  saleItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  removeItemButton: {
    padding: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  saleItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginHorizontal: 10,
    minWidth: 40,
    height: 36,
    textAlign: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    fontSize: 12,
    color: '#64748b',
  },
  subtotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  discountValue: {
    color: '#ef4444',
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
    marginLeft: 10,
  },
  finalSummaryContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    marginTop: 8,
  },
  finalSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 12,
  },
  finalSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  finalSummaryLabel: {
    fontSize: 14,
    color: '#78350f',
    fontWeight: '600',
    marginRight: 6,
  },
  finalSummaryValue: {
    fontSize: 14,
    color: '#451a03',
    flex: 1,
  },
  finalSummaryTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  finishButton: {
    flex: 1,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  finishButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
});
