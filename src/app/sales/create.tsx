import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSaleDatabase } from "@/database/models/Sale";
import { useCustomerDatabase } from "@/database/models/Customer";
import { useProductDatabase } from "@/database/models/Product";
import { Input } from "@/components/Input";
import formatCurrency from "@/components/utils/formatCurrency";
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTime } from "luxon";
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
  { value: 'money', label: 'Dinheiro' },
  { value: 'card', label: 'Cartão' },
  { value: 'pix', label: 'PIX' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'installment', label: 'Parcelado' },
];

export default function CreateSale() {
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("money");
  const [installments, setInstallments] = useState("1");
  const [saleDate, setSaleDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [firstDueDate, setFirstDueDate] = useState(new Date());
  const [firstDueDatePlusOneMonth, setFirstDueDatePlusOneMonth] = useState(DateTime.now().plus({ months: 1 }).toJSDate());
  const [showFirstDuePicker, setShowFirstDuePicker] = useState(false);

  const saleDatabase = useSaleDatabase();
  const customerDatabase = useCustomerDatabase();
  const productDatabase = useProductDatabase();

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    if (paymentMethod === "installment") {
      const nextMonth = new Date(saleDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setFirstDueDate(nextMonth);
    } else {
      setFirstDueDate(saleDate);
    }
  }, [paymentMethod, saleDate]);

  const loadCustomers = async () => {
    try {
      const customersData = await customerDatabase.index();
      setCustomers(customersData.map(customer => ({
        id: customer.id!,
        name: customer.name!,
        email: customer.email,
        phone: customer.phone,
      })));
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await productDatabase.index({ active: 1 });
      setProducts(productsData.map(product => ({
        id: product.id!,
        name: product.name!,
        sale_price: product.sale_price!,
        initial_stock: product.initial_stock!,
        current_stock: product.current_stock,
        barcode: product.barcode,
      })));
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const formatNumber = (text: string) => {
    return text.replace(/\D/g, '');
  };

  const getCurrencyValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue
      .replace(/[R$\s.]/g, '')
      .replace(',', '.');
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

  const addProductToSale = (product: Product) => {
    const existingItem = items.find(item => item.product_id === product.id);

    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      const availableStock = product.current_stock || product.initial_stock;

      if (newQuantity > availableStock) {
        Alert.alert("Estoque insuficiente", `Apenas ${availableStock} unidades disponíveis`);
        return;
      }

      updateItemQuantity(product.id, newQuantity);
    } else {
      const availableStock = product.current_stock || product.initial_stock;

      if (availableStock <= 0) {
        Alert.alert("Estoque insuficiente", "Produto sem estoque disponível");
        return;
      }

      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.sale_price,
        subtotal: product.sale_price,
      };
      setItems([...items, newItem]);
    }
    setShowProductPicker(false);
  };

  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    const availableStock = product?.current_stock || product?.initial_stock || 0;

    if (newQuantity > availableStock) {
      Alert.alert("Estoque insuficiente", `Apenas ${availableStock} unidades disponíveis`);
      return;
    }

    setItems(items.map(item =>
      item.product_id === productId
        ? {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * item.unit_price
        }
        : item
    ));
  };

  const updateItemPrice = (productId: number, newPrice: number) => {
    setItems(items.map(item =>
      item.product_id === productId
        ? {
          ...item,
          unit_price: newPrice,
          subtotal: item.quantity * newPrice
        }
        : item
    ));
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(item => item.product_id !== productId));
  };

  const validateForm = () => {
    if (items.length === 0) {
      Alert.alert("Erro", "Adicione pelo menos um produto à venda.");
      return false;
    }

    if (getTotal() <= 0) {
      Alert.alert("Erro", "O total da venda deve ser maior que zero.");
      return false;
    }

    if (paymentMethod === 'installment' && parseInt(installments) <= 1) {
      Alert.alert("Erro", "Para pagamento parcelado, informe mais de 1 parcela.");
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
      const installmentCount = paymentMethod === 'installment' ? parseInt(installments) : 1;

      await saleDatabase.store({
        customer_id: customerId as number,
        subtotal,
        discount: discountValue,
        total,
        payment_method: paymentMethod as any,
        installments: installmentCount,
        status: 'pending',
        sale_date: saleDate,
        notes: notes.trim() || undefined,
        itens: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
        first_due_date: firstDueDate,
      });

      Alert.alert(
        "Sucesso",
        "Venda criada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating sale:", error);
      Alert.alert("Erro", "Falha ao criar venda. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = items.length > 0 || discount.trim() || notes.trim() || customerId;

    if (hasChanges) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem alterações não salvas. Deseja realmente sair?",
        [
          { text: "Continuar editando", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const getSelectedCustomerName = () => {
    if (!customerId) return "Selecionar cliente";
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Cliente não encontrado";
  };

  const getSelectedPaymentMethodLabel = () => {
    const method = PAYMENT_METHODS.find(m => m.value === paymentMethod);
    return method ? method.label : paymentMethod;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.barcode && product.barcode.includes(productSearch))
  );

  const isFormValid = items.length > 0 && getTotal() > 0;

  const renderSaleItem = ({ item }: { item: SaleItem }) => (
    <View style={styles.saleItem}>
      <View style={styles.saleItemHeader}>
        <Text style={styles.saleItemName}>{item.product_name}</Text>
        <TouchableOpacity
          style={styles.removeItemButton}
          onPress={() => removeItem(item.product_id)}
        >
          <Ionicons name="close" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.saleItemDetails}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateItemQuantity(item.product_id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={16} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => updateItemQuantity(item.product_id, item.quantity + 1)}
          >
            <Ionicons name="add" size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.unitPrice}>
            {formatCurrency((item.unit_price).toString())}
          </Text>
          <Text style={styles.subtotal}>
            {formatCurrency((item.subtotal).toString())}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="receipt-outline" size={48} color="#FF6B35" />
          </View>
          <Text style={styles.title}>Nova Venda</Text>
          <Text style={styles.subtitle}>
            Registre uma nova venda no sistema
          </Text>
        </View>

        <View style={styles.formSection}>
          {/* Cliente */}
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Cliente</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cliente</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowCustomerPicker(!showCustomerPicker)}
              disabled={isLoading}
            >
              <Text style={[
                styles.selectorText,
                !customerId && styles.selectorPlaceholder
              ]}>
                {getSelectedCustomerName()}
              </Text>
              <Ionicons
                name={showCustomerPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>

            {showCustomerPicker && (
              <View style={styles.pickerContainer}>
                <Input
                  placeholder="Buscar cliente..."
                  value={customerSearch}
                  onChangeText={setCustomerSearch}
                  style={styles.searchInput}
                />
                <ScrollView style={styles.optionsList} nestedScrollEnabled>
                  {filteredCustomers.map((customer) => (
                    <TouchableOpacity
                      key={customer.id}
                      style={[
                        styles.option,
                        customerId === customer.id && styles.optionSelected
                      ]}
                      onPress={() => {
                        setCustomerId(customer.id);
                        setShowCustomerPicker(false);
                        setCustomerSearch("");
                      }}
                    >
                      <Text style={[
                        styles.optionText,
                        customerId === customer.id && styles.optionSelectedText
                      ]}>
                        {customer.name}
                      </Text>
                      {customer.email && (
                        <Text style={styles.optionSubtext}>{customer.email}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Produtos */}
          <View style={styles.sectionHeader}>
            <Ionicons name="cube-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Produtos</Text>
          </View>

          <TouchableOpacity
            style={styles.addProductButton}
            onPress={() => setShowProductPicker(!showProductPicker)}
            disabled={isLoading}
          >
            <Ionicons name="add" size={20} color="#FF6B35" />
            <Text style={styles.addProductText}>Adicionar Produto</Text>
          </TouchableOpacity>

          {showProductPicker && (
            <View style={styles.pickerContainer}>
              <Input
                placeholder="Buscar produto ou código de barras..."
                value={productSearch}
                onChangeText={setProductSearch}
                style={styles.searchInput}
              />
              <ScrollView style={styles.optionsList} nestedScrollEnabled>
                {filteredProducts.map((product) => {
                  const availableStock = product.current_stock || product.initial_stock;
                  return (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.option,
                        availableStock <= 0 && styles.optionDisabled
                      ]}
                      onPress={() => availableStock > 0 && addProductToSale(product)}
                      disabled={availableStock <= 0}
                    >
                      <View style={styles.productOption}>
                        <Text style={[
                          styles.optionText,
                          availableStock <= 0 && styles.optionDisabledText
                        ]}>
                          {product.name}
                        </Text>
                        <Text style={[
                          styles.productPrice,
                          availableStock <= 0 && styles.optionDisabledText
                        ]}>
                          {formatCurrency((product.sale_price).toString())}
                        </Text>
                      </View>
                      <Text style={[
                        styles.productStock,
                        availableStock <= 0 && styles.stockEmpty
                      ]}>
                        Estoque: {availableStock}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {items.length > 0 && (
            <View style={styles.itemsList}>
              <FlatList
                data={items}
                renderItem={renderSaleItem}
                keyExtractor={(item) => item.product_id.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

          {/* Pagamento */}
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Pagamento</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Forma de Pagamento</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowPaymentPicker(!showPaymentPicker)}
              disabled={isLoading}
            >
              <Text style={styles.selectorText}>
                {getSelectedPaymentMethodLabel()}
              </Text>
              <Ionicons
                name={showPaymentPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>

            {showPaymentPicker && (
              <View style={styles.pickerContainer}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    style={[
                      styles.option,
                      paymentMethod === method.value && styles.optionSelected
                    ]}
                    onPress={() => {
                      setPaymentMethod(method.value);
                      setShowPaymentPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      paymentMethod === method.value && styles.optionSelectedText
                    ]}>
                      {method.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {paymentMethod === 'installment' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número de Parcelas</Text>
              <Input
                placeholder="Número de parcelas"
                value={installments}
                onChangeText={(text) => setInstallments(formatNumber(text))}
                editable={!isLoading}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{paymentMethod === 'installment' ? 'Data do Primeiro Vencimento' : 'Data do Pagamento'}</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowFirstDuePicker(true)}
              disabled={isLoading}
            >
              <Text style={styles.selectorText}>
                {firstDueDate.toLocaleDateString("pt-BR")}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>

            {showFirstDuePicker && (
              <DateTimePicker
                value={paymentMethod === 'installment' ? firstDueDatePlusOneMonth : firstDueDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, date) => {
                  setShowFirstDuePicker(false);
                  if (date) setFirstDueDate(date);
                }}
              />
            )}
          </View>



          <View style={styles.inputGroup}>
            <Text style={styles.label}>Desconto</Text>
            <Input
              placeholder="R$ 0,00"
              value={discount}
              onChangeText={(text) => setDiscount(formatCurrency(text))}
              editable={!isLoading}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>

          {/* Resumo */}
          {items.length > 0 && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal:</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency((getSubtotal()).toString())}
                </Text>
              </View>
              {getDiscountValue() > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Desconto:</Text>
                  <Text style={[styles.summaryValue, styles.discountValue]}>
                    -{formatCurrency((getDiscountValue()).toString())}
                  </Text>
                </View>
              )}
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency((getTotal()).toString())}
                </Text>
              </View>
            </View>
          )}

          {/* Observações */}
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Observações</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Observações</Text>
            <Input
              placeholder="Informações adicionais sobre a venda (opcional)"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              editable={!isLoading}
              style={[styles.input, styles.textArea]}
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Adicione produtos à venda para continuar. O estoque será atualizado automaticamente após a conclusão.
              {'\n\n'}💡 Para pagamento parcelado, o sistema gerará as parcelas automaticamente.
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, (!isFormValid || isLoading) && styles.saveButtonDisabled]}
            onPress={handleStore}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                <Text style={styles.saveButtonText}>Finalizar Venda</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
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
  formSection: {
    marginBottom: 32,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
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
  selectorPlaceholder: {
    color: '#94a3b8',
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
  optionSelected: {
    backgroundColor: '#fff5f0',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  optionSelectedText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  optionDisabledText: {
    color: '#94a3b8',
  },
  optionSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginHorizontal: 16,
    minWidth: 20,
    textAlign: 'center',
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
    marginTop: 'auto',
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
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
