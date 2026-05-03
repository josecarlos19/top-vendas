import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSaleDatabase } from '@/database/models/Sale';
import { useCustomerDatabase } from '@/database/models/Customer';
import { useProductDatabase } from '@/database/models/Product';
import { FormSection, FormInput, FormSelector, InfoCard } from '@/components/Form';
import formatCurrency from '@/components/utils/formatCurrency';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useInstallmentDatabase } from '@/database/models/Installment';
import WorkArea from '@/components/WorkArea';
import SearchableSelect from '@/components/SearchableSelect';
import CollapsibleSection from '@/components/CollapsibleSection';
import { formatDate } from '@/database/utils/formatDate';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  first_installment_id: number;
  installments?: Installment[];
  payment_date?: string;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Dinheiro' },
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
  const [sale, setSale] = useState<Sale>();
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [installments, setInstallments] = useState('1');
  const [status, setStatus] = useState('completed');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [firstDueDate, setFirstDueDate] = useState(new Date());
  const [showFirstDuePicker, setShowFirstDuePicker] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [showPaymentDatePicker, setShowPaymentDatePicker] = useState(false);
  const [saleDate, setSaleDate] = useState<Date | null>(null);

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
      setSaleDate(
        foundSale!.sale_date ? new Date(foundSale!.sale_date) : new Date()
      );
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
      if ((foundSale as any).first_due_date) {
        setFirstDueDate(new Date((foundSale as any).first_due_date));
      } else {
        setFirstDueDate(new Date(foundSale.sale_date));
      }
      if ((foundSale as any).payment_date) {
        setPaymentDate(new Date((foundSale as any).payment_date));
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

  const handlePaymentDateChange = async (date: Date) => {
    setPaymentDate(date);
    await installmentDatabase.updateStatus({
      id: sale!.first_installment_id,
      status: 'completed',
      payment_date: date.toISOString(),
    });
    await loadSale();
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
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
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
          <FormSection icon='flag-outline' title='Status'>
            <SearchableSelect
              selectedValue={status}
              onValueChange={value => setStatus(value as string)}
              options={STATUS_OPTIONS}
              enabled={!isSaving && paymentMethod !== 'installment'}
            />

            {paymentMethod === 'installment' && (
              <InfoCard variant='info'>
                Para vendas parceladas, o status é atualizado automaticamente conforme as parcelas são pagas.
              </InfoCard>
            )}
          </FormSection>

          {/* Cliente */}
          <FormSection icon='person-outline' title='Cliente'>
            <FormSelector
              label='Cliente selecionado'
              value={customers.find(c => c.id === customerId)?.name || 'Nenhum cliente'}
              onPress={() => { }}
              disabled={true}
              icon='person-outline'
            />
          </FormSection>

          {/* Produtos */}
          <FormSection icon='bag-outline' title='Produtos'>
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
          </FormSection>

          {/* Pagamento */}
          <FormSection icon='card-outline' title='Forma de Pagamento'>
            <FormSelector
              label='Método de pagamento'
              value={PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label || paymentMethod}
              onPress={() => { }}
              disabled={true}
              icon='card-outline'
            />
          </FormSection>

          {/* Data da Venda */}
          <FormSection icon='calendar-outline' title='Data da Venda'>
            <FormSelector
              label='Data'
              value={saleDate!.toLocaleDateString('pt-BR')}
              onPress={() => { }}
              disabled={true}
              icon='calendar-outline'
            />
          </FormSection>

          {paymentMethod === 'installment' && (
            <FormSection icon='wallet-outline' title='Parcelamento'>
              <FormInput
                label='Número de Parcelas'
                value={installments}
                editable={false}
              />

              <FormSelector
                label='Data do Primeiro Vencimento'
                value={firstDueDate.toLocaleDateString('pt-BR')}
                onPress={() => setShowFirstDuePicker(true)}
                disabled={true}
                icon='calendar-outline'
              />

              {showFirstDuePicker && (
                <DateTimePicker
                  value={firstDueDate}
                  mode='date'
                  disabled
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowFirstDuePicker(false);
                    if (date) setFirstDueDate(date);
                  }}
                />
              )}

              {sale?.installments && sale.installments.length > 0 && (
                <CollapsibleSection
                  title="Parcelas"
                  icon="list-outline"
                  iconColor="#3b82f6"
                  defaultCollapsed={true}
                  badge={`${sale.installments.filter(i => i.status === 'completed').length}/${sale.installments.length} pagas`}
                >
                  {sale.installments.map(inst => (
                    <View
                      key={inst.id}
                      style={[
                        styles.installmentItem,
                        inst.status === 'completed' && styles.installmentPaid,
                      ]}
                    >
                      <View>
                        <Text style={styles.installmentText}>
                          {inst.number}ª parcela —{' '}
                          {formatCurrency(inst.amount.toString())}
                        </Text>
                        {inst.status === 'completed' ? (
                          <Text style={styles.installmentDate}>
                            Data Pagamento:{' '}
                            {inst.payment_date
                              ? formatDate(inst.payment_date)
                              : '-'}
                          </Text>
                        ) : (
                          <Text style={styles.installmentDate}>
                            Vencimento: {formatDate(inst.due_date)}
                          </Text>
                        )}
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
                    </View>
                  ))}
                </CollapsibleSection>
              )}
            </FormSection>
          )}

          {paymentMethod !== 'installment' && (
            <FormSection icon='calendar-outline' title='Data do Pagamento' marginTop={0}>
              <FormSelector
                label='Data do pagamento'
                value={paymentDate ? paymentDate.toLocaleDateString('pt-BR') : ''}
                onPress={() => setShowPaymentDatePicker(true)}
                placeholder='Selecione a data'
                icon='calendar-outline'
              />

              {showPaymentDatePicker && (
                <DateTimePicker
                  value={paymentDate ?? new Date()}
                  mode='date'
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowPaymentDatePicker(false);
                    if (date) {
                      handlePaymentDateChange(date);
                    }
                  }}
                />
              )}
            </FormSection>
          )}

          {/* Desconto e Resumo */}
          <FormSection icon='pricetag-outline' title='Desconto e Resumo'>
            <FormInput
              label='Desconto'
              value={discount || 'R$ 0,00'}
              editable={false}
            />
          </FormSection>

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

          <FormSection icon='document-text-outline' title='Observações'>
            <FormInput
              label='Observações'
              placeholder='Informações adicionais sobre a venda (opcional)'
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              editable={!isSaving}
              style={styles.textArea}
            />

            <InfoCard variant='warning' icon='warning-outline'>
              Ao excluir esta venda, todos os produtos serão devolvidos ao
              estoque e as parcelas pendentes serão canceladas.
            </InfoCard>
          </FormSection>
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
      </WorkArea>
    </SafeAreaView>
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
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 12,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  itemsList: {
    marginTop: 12,
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
  saleItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 3,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginHorizontal: 10,
    minWidth: 40,
    textAlign: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  unitPrice: {
    fontSize: 13,
    color: '#64748b',
  },
  subtotal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B35',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto',
    paddingTop: 16,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  installmentItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  installmentPaid: {
    opacity: 0.6,
  },
  installmentText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
  installmentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  installmentStatus: {
    fontSize: 12,
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
    borderRadius: 10,
    padding: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 10,
  },
  modalAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#22c55e',
    marginBottom: 6,
  },
  modalDueDate: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 15,
    color: '#1e293b',
  },
  confirmButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  revertButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  modalPaidText: {
    fontSize: 14,
    color: '#22c55e',
    marginBottom: 16,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
});
