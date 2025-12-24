import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSaleDatabase } from '@/database/models/Sale';
import { useCustomerDatabase } from '@/database/models/Customer';
import { useProductDatabase } from '@/database/models/Product';
import { Input } from '@/components/Input';
import formatCurrency from '@/components/utils/formatCurrency';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useInstallmentDatabase } from '@/database/models/Installment';
import WorkArea from '@/components/WorkArea';
import CustomPicker from '@/components/CustomPicker';

type statusTypes = 'completed' | 'pending';

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
  { value: 'pix', label: 'PIX' },
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
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('money');
  const [installments, setInstallments] = useState('1');
  const [status, setStatus] = useState('completed');
  const [saleDate, setSaleDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [firstDueDate, setFirstDueDate] = useState(new Date());
  const [showFirstDuePicker, setShowFirstDuePicker] = useState(false);
  const [selectedInstallment, setSelectedInstallment] =
    useState<Installment | null>(null);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);

  const saleDatabase = useSaleDatabase();
  const installmentDatabase = useInstallmentDatabase();
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
      const foundSale = (await saleDatabase.show(+id)) as Sale | null;

      if (!foundSale) {
        Alert.alert('Erro', 'Venda não encontrada', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setSale(foundSale);
      setCustomerId(foundSale.customer_id);
      setDiscount(
        foundSale.discount ? formatCurrency(foundSale.discount.toString()) : ''
      );
      setPaymentMethod(foundSale.payment_method);
      setInstallments(
        foundSale.installments?.length
          ? foundSale.installments.length.toString()
          : '1'
      );
      setStatus(foundSale.status);
      setSaleDate(new Date(foundSale.sale_date));
      if ((foundSale as any).first_due_date) {
        setFirstDueDate(new Date((foundSale as any).first_due_date));
      } else {
        setFirstDueDate(new Date(foundSale.sale_date));
      }
      setNotes(foundSale.notes || '');

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
      console.error('Error loading sale:', error);
      Alert.alert('Erro', 'Falha ao carregar venda');
    } finally {
      setIsLoading(false);
    }
  };

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
      const productsData = await productDatabase.index();
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

  const handleInstallment = async (status: statusTypes) => {
    if (!selectedInstallment) {
      return;
    }

    try {
      await installmentDatabase.updateStatus({
        id: selectedInstallment.id,
        status,
        payment_date: paymentDate.toISOString(),
      });

      Alert.alert(
        'Sucesso',
        status === 'completed'
          ? 'Pagamento registrado!'
          : 'Pagamento revertido!'
      );
      setSale(prev =>
        prev
          ? {
              ...prev,
              installments: prev.installments?.map(inst =>
                inst.id === selectedInstallment.id
                  ? {
                      ...inst,
                      status,
                      payment_date:
                        status === 'completed'
                          ? paymentDate.toISOString()
                          : undefined,
                    }
                  : inst
              ),
            }
          : prev
      );

      setShowInstallmentModal(false);
      await loadSale();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar a parcela.');
    }
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

    if (paymentMethod === 'installment' && parseInt(installments) <= 1) {
      Alert.alert(
        'Erro',
        'Para pagamento parcelado, informe mais de 1 parcela.'
      );
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm() || !sale) return;

    setIsSaving(true);
    try {
      await saleDatabase.update({
        id: sale.id,
        status: status as any,
        notes: notes.trim() || undefined,
        first_due_date: firstDueDate,
      });

      Alert.alert('Sucesso', 'Venda atualizada com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating sale:', error);
      Alert.alert('Erro', 'Falha ao atualizar venda. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!sale) return;

    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir esta venda? Esta ação não pode ser desfeita e o estoque será revertido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!sale) return;

    try {
      await saleDatabase.remove(sale.id);
      Alert.alert('Sucesso', 'Venda excluída com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error deleting sale:', error);
      Alert.alert('Erro', 'Falha ao excluir venda');
    }
  };

  const handleCancel = () => {
    if (!sale) return;

    const hasChanges =
      status !== sale.status ||
      notes !== (sale.notes || '') ||
      firstDueDate.getTime() !==
        new Date(sale.first_due_date || sale.sale_date).getTime();

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

  const openInstallmentModal = (inst: Installment) => () => {
    setSelectedInstallment(inst);
    setPaymentDate(new Date());
    setShowInstallmentModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#FF6B35' />
        <Text style={styles.loadingText}>Carregando venda...</Text>
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle-outline' size={64} color='#ef4444' />
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

  const customerOptions = customers.map(customer => ({
    label: customer.name,
    value: customer.id,
  }));

  const renderSaleItem = ({ item }: { item: SaleItem }) => (
    <View style={styles.saleItem}>
      <View style={styles.saleItemHeader}>
        <Text style={styles.saleItemName}>{item.product_name}</Text>
      </View>

      <View style={styles.saleItemDetails}>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
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
    <WorkArea>
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Ionicons name='receipt-outline' size={48} color='#FF6B35' />
        </View>
        <Text style={styles.title}>Editar Venda</Text>
        <Text style={styles.subtitle}>Atualize as informações da venda</Text>
      </View>

      <View style={styles.formSection}>
        {/* Status */}
        <View style={styles.sectionHeader}>
          <Ionicons name='flag-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Status</Text>
        </View>

        <CustomPicker
          label='Status da Venda'
          selectedValue={status}
          onValueChange={value => setStatus(value as string)}
          options={STATUS_OPTIONS}
          enabled={!isSaving}
        />

        {/* Cliente */}
        <View style={styles.sectionHeader}>
          <Ionicons name='person-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Cliente</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cliente</Text>
          <View style={[styles.disabledField]}>
            <Text style={styles.disabledText}>
              {customers.find(c => c.id === customerId)?.name ||
                'Nenhum cliente'}
            </Text>
          </View>
        </View>

        {/* Produtos */}
        <View style={styles.sectionHeader}>
          <Ionicons name='cube-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Produtos</Text>
        </View>

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
          <Text style={styles.sectionTitle}>Pagamento</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Forma de Pagamento</Text>
          <View style={styles.disabledField}>
            <Text style={styles.disabledText}>
              {PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label ||
                paymentMethod}
            </Text>
          </View>
        </View>

        {paymentMethod === 'installment' && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de Parcelas</Text>
            <View style={styles.disabledField}>
              <Text style={styles.disabledText}>{installments}</Text>
            </View>
          </View>
        )}

        {sale.payment_method === 'installment' &&
          sale?.installments &&
          sale.installments.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Parcelas</Text>
              {sale.installments.map(inst => (
                <TouchableOpacity
                  key={inst.id}
                  style={[
                    styles.installmentItem,
                    inst.status === 'completed' && styles.installmentPaid,
                  ]}
                  activeOpacity={0.7}
                  onPress={openInstallmentModal(inst)}
                >
                  <View>
                    <Text style={styles.installmentText}>
                      {inst.number}ª parcela —{' '}
                      {formatCurrency(inst.amount.toString())}
                    </Text>
                    <Text style={styles.installmentDate}>
                      Venc:{' '}
                      {new Date(inst.due_date).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.installmentStatus,
                      inst.status === 'completed'
                        ? styles.installmentStatusPaid
                        : styles.installmentStatusPending,
                    ]}
                  >
                    {inst.status === 'completed' ? 'Paga' : 'Pendente'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {paymentMethod === 'installment'
              ? 'Data do Primeiro Vencimento'
              : 'Data do Pagamento'}
          </Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowFirstDuePicker(true)}
            disabled={isSaving}
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
              onChange={(event, date) => {
                setShowFirstDuePicker(false);
                if (date) setFirstDueDate(date);
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Desconto</Text>
          <View style={styles.disabledField}>
            <Text style={styles.disabledText}>{discount || 'R$ 0,00'}</Text>
          </View>
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
          <Text style={styles.label}>Observações</Text>
          <Input
            placeholder='Informações adicionais sobre a venda (opcional)'
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
            <Ionicons name='warning-outline' size={20} color='#f59e0b' />
            <Text style={[styles.infoText, styles.warningText]}>
              Ao excluir esta venda, todos os produtos serão devolvidos ao
              estoque e as parcelas pendentes serão canceladas.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleUpdate}
          disabled={!isFormValid || isSaving}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size='small' color='#ffffff' />
              <Text style={styles.saveButtonText}>Salvando...</Text>
            </>
          ) : (
            <>
              <Ionicons name='checkmark-outline' size={16} color='#ffffff' />
              <Text style={styles.saveButtonText}>Salvar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showInstallmentModal}
        transparent
        animationType='slide'
        onRequestClose={() => setShowInstallmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedInstallment && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedInstallment.number}ª parcela
                </Text>
                <Text style={styles.modalAmount}>
                  Valor: {formatCurrency(selectedInstallment.amount.toString())}
                </Text>
                <Text style={styles.modalDueDate}>
                  Vencimento:{' '}
                  {new Date(selectedInstallment.due_date).toLocaleDateString(
                    'pt-BR'
                  )}
                </Text>

                <Text style={styles.modalLabel}>Data de pagamento</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowPaymentDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {paymentDate.toLocaleDateString('pt-BR')}
                  </Text>
                  <Ionicons name='calendar-outline' size={20} color='#64748b' />
                </TouchableOpacity>

                {showPaymentDatePicker && (
                  <DateTimePicker
                    value={paymentDate}
                    mode='date'
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => {
                      setShowPaymentDatePicker(false);
                      if (date) setPaymentDate(date);
                    }}
                  />
                )}

                {selectedInstallment.status === 'pending' ? (
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleInstallment('completed')}
                  >
                    <Text style={styles.confirmButtonText}>
                      Confirmar pagamento
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.revertButton}
                    onPress={() => handleInstallment('pending')}
                  >
                    <Text style={styles.confirmButtonText}>
                      Reverter pagamento
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowInstallmentModal(false)}
                >
                  <Text style={styles.closeButtonText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </WorkArea>
  );
}

const styles = StyleSheet.create({
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
  selectorText: {
    fontSize: 16,
    color: '#1e293b',
  },
  disabledField: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  disabledText: {
    fontSize: 16,
    color: '#64748b',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  modalAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
    marginBottom: 6,
  },
  modalDueDate: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
  },
  confirmButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  revertButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalPaidText: {
    fontSize: 15,
    color: '#22c55e',
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
});
