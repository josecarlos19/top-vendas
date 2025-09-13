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
import { router, useLocalSearchParams } from 'expo-router';
import { useSaleDatabase } from "@/database/models/Sale";
import { useCustomerDatabase } from "@/database/models/Customer";
import { useProductDatabase } from "@/database/models/Product";
import { Input } from "@/components/Input";
import formatCurrency from "@/components/utils/formatCurrency";
import DateTimePicker from '@react-native-community/datetimepicker';

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

interface Installment {
  id: number;
  number: number;
  amount: number;
  due_date: string;
  payment_date?: string;
  paid_amount?: number;
  status: string;
  notes?: string;
}

interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  status: string;
  sale_date: string;
  notes?: string;
  items?: any[];
  first_due_date?: string;
  installments?: Installment[];
}

const PAYMENT_METHODS = [
  { value: 'money', label: 'Dinheiro' },
  { value: 'card', label: 'Cartão' },
  { value: 'pix', label: 'PIX' },
  { value: 'transfer', label: 'Transferência' },
  { value: 'installment', label: 'Parcelado' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
];

export default function EditSale() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("money");
  const [installments, setInstallments] = useState("1");
  const [status, setStatus] = useState("completed");
  const [saleDate, setSaleDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showPaymentPicker, setShowPaymentPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [firstDueDate, setFirstDueDate] = useState(new Date());
  const [showFirstDuePicker, setShowFirstDuePicker] = useState(false);

  const saleDatabase = useSaleDatabase();
  const customerDatabase = useCustomerDatabase();
  const productDatabase = useProductDatabase();

  useEffect(() => {
    loadSale();
    loadCustomers();
    loadProducts();
  }, [id]);

  const loadSale = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const foundSale = await saleDatabase.show(+id) as Sale | null;

      if (!foundSale) {
        Alert.alert("Erro", "Venda não encontrada", [
          { text: "OK", onPress: () => router.back() },
        ]);
        return;
      }

      setSale(foundSale);
      setCustomerId(foundSale.customer_id);
      setDiscount(foundSale.discount ? formatCurrency((foundSale.discount).toString()) : "");
      setPaymentMethod(foundSale.payment_method);
      setInstallments(foundSale.installments?.length ? foundSale.installments.length.toString() : "1");
      setStatus(foundSale.status);
      setSaleDate(new Date(foundSale.sale_date));
      if ((foundSale as any).first_due_date) {
        setFirstDueDate(new Date((foundSale as any).first_due_date));
      } else {
        setFirstDueDate(new Date(foundSale.sale_date));
      }
      setNotes(foundSale.notes || "");

      if (foundSale.items) {
        const saleItems: SaleItem[] = foundSale.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        }));
        setItems(saleItems);
      }
    } catch (error) {
      console.error("Error loading sale:", error);
      Alert.alert("Erro", "Falha ao carregar venda");
    } finally {
      setIsLoading(false);
    }
  };

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
      const productsData = await productDatabase.index();
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
    setShowProductPicker(false);
  };

  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
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

  const handleUpdate = async () => {
    if (!validateForm() || !sale) return;

    setIsSaving(true);
    try {
      const subtotal = getSubtotal();
      const discountValue = getDiscountValue();
      const total = getTotal();
      const installmentCount = paymentMethod === 'installment' ? parseInt(installments) : 1;

      await saleDatabase.update({
        id: sale.id,
        status: status as any,
        notes: notes.trim() || undefined,
        first_due_date: firstDueDate,
      });

      Alert.alert(
        "Sucesso",
        "Venda atualizada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error updating sale:", error);
      Alert.alert("Erro", "Falha ao atualizar venda. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!sale) return;

    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir esta venda? Esta ação não pode ser desfeita e o estoque será revertido.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    if (!sale) return;

    try {
      await saleDatabase.remove(sale.id);
      Alert.alert("Sucesso", "Venda excluída com sucesso!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error deleting sale:", error);
      Alert.alert("Erro", "Falha ao excluir venda");
    }
  };

  const handleCancel = () => {
    if (!sale) return;

    const hasChanges =
      customerId !== sale.customer_id ||
      getCurrencyValue(discount) !== (sale.discount ? sale.discount : 0) ||
      paymentMethod !== sale.payment_method ||
      parseInt(installments) !== sale.installments?.length ||
      status !== sale.status ||
      saleDate.getTime() !== new Date(sale.sale_date).getTime() ||
      notes !== (sale.notes || "") ||
      JSON.stringify(items) !== JSON.stringify(sale.items?.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
      })) || []);

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
    if (!customerId) return "Nenhum cliente";
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Cliente não encontrado";
  };

  const getSelectedPaymentMethodLabel = () => {
    const method = PAYMENT_METHODS.find(m => m.value === paymentMethod);
    return method ? method.label : paymentMethod;
  };

  const getSelectedStatusLabel = () => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (product.barcode && product.barcode.includes(productSearch))
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando venda...</Text>
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>Venda não encontrada</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFormValid = items.length > 0 && getTotal() > 0;

  const renderSaleItem = ({ item }: { item: SaleItem }) => (
    <View style={styles.saleItem}>
      <View style={styles.saleItemHeader}>
        <Text style={styles.saleItemName}>{item.product_name}</Text>
      </View>

      <View style={styles.saleItemDetails}>
        <View style={styles.quantityContainer}>
          <Text disabled style={styles.quantityText}>{item.quantity}</Text>
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
          <Text style={styles.title}>Editar Venda</Text>
          <Text style={styles.subtitle}>
            Atualize as informações da venda
          </Text>
        </View>

        <View style={styles.formSection}>
          {/* Status */}
          <View style={styles.sectionHeader}>
            <Ionicons name="flag-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Status</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status da Venda</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowStatusPicker(!showStatusPicker)}
              disabled={isSaving}
            >
              <Text style={styles.selectorText}>
                {getSelectedStatusLabel()}
              </Text>
              <Ionicons
                name={showStatusPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>

            {showStatusPicker && (
              <View style={styles.pickerContainer}>
                {STATUS_OPTIONS.map((statusOption) => (
                  <TouchableOpacity
                    key={statusOption.value}
                    style={[
                      styles.option,
                      status === statusOption.value && styles.optionSelected
                    ]}
                    onPress={() => {
                      setStatus(statusOption.value);
                      setShowStatusPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      status === statusOption.value && styles.optionSelectedText
                    ]}>
                      {statusOption.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Cliente */}
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Cliente</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cliente</Text>
            <TouchableOpacity
              style={{ ...styles.selector, ...styles.disabledInput }}
              onPress={() => setShowCustomerPicker(!showCustomerPicker)}
              disabled
            >
              <Text style={[
                styles.selectorText,
                !customerId && styles.selectorPlaceholder
              ]}>
                {getSelectedCustomerName()}
              </Text>

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
              style={{ ...styles.selector, ...styles.disabledInput }}
              onPress={() => setShowPaymentPicker(!showPaymentPicker)}
              disabled
            >
              <Text style={styles.selectorText}>
                {getSelectedPaymentMethodLabel()}
              </Text>

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
                editable={!isSaving}
                style={{ ...styles.input, ...styles.disabledInput }}
                keyboardType="numeric"
                readOnly
              />
            </View>
          )}

          {sale.payment_method === 'installment' && sale?.installments && sale.installments.length > 0 && (
            <View>
              <Text style={styles.label}>Parcelas</Text>
              {sale.installments.map((inst) => (
                <View
                  key={inst.id}
                  style={[
                    styles.installmentItem,
                    inst.status === 'paid' && styles.installmentPaid,
                  ]}
                >
                  <Text style={styles.installmentText}>
                    {inst.number}ª parcela — {formatCurrency(inst.amount.toString())}
                  </Text>
                  <Text style={styles.installmentDate}>
                    Venc: {new Date(inst.due_date).toLocaleDateString('pt-BR')}
                  </Text>
                  <Text
                    style={[
                      styles.installmentStatus,
                      inst.status === 'paid'
                        ? styles.installmentStatusPaid
                        : styles.installmentStatusPending,
                    ]}
                  >
                    {inst.status === 'paid' ? 'Paga' : 'Pendente'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{paymentMethod === 'installment' ? 'Data do Primeiro Vencimento' : 'Data do Pagamento'}</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowFirstDuePicker(true)}
              disabled={isSaving}
            >
              <Text style={styles.selectorText}>
                {firstDueDate.toLocaleDateString('pt-BR')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
            </TouchableOpacity>

            {showFirstDuePicker && (
              <DateTimePicker
                value={firstDueDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
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
              editable={false}
              style={{ ...styles.input, ...styles.disabledInput }}
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
              editable={!isSaving}
              style={[styles.input, styles.textArea]}
            />
          </View>

          <View style={styles.infoSection}>
            <View style={[styles.infoCard, styles.warningCard]}>
              <Ionicons name="warning-outline" size={20} color="#f59e0b" />
              <Text style={[styles.infoText, styles.warningText]}>
                Ao excluir esta venda, todos os produtos serão devolvidos ao estoque e as parcelas pendentes serão canceladas.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isSaving}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, (!isFormValid || isSaving) && styles.saveButtonDisabled]}
            onPress={handleUpdate}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                <Text style={styles.saveButtonText}>Salvar</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
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
  disabledInput: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    opacity: 0.7,
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
  optionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  optionSelectedText: {
    color: '#FF6B35',
    fontWeight: '600',
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
  infoSection: {
    gap: 12,
    marginTop: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  warningCard: {
    backgroundColor: '#fffbeb',
    borderLeftColor: '#f59e0b',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginLeft: 12,
  },
  warningText: {
    color: '#92400e',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 20,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
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
    flex: 1,
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

  installmentItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  installmentPaid: {
    opacity: 0.6,
  },
  installmentText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  installmentDate: {
    fontSize: 13,
    color: '#64748b',
  },
  installmentStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  installmentStatusPaid: {
    color: '#22c55e',
  },
  installmentStatusPending: {
    color: '#f59e0b',
  },
});
