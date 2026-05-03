import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import CustomDialog from './modals/CustomDialog';
import PaymentDateModal from './modals/PaymentDateModal';
import { useCustomDialog } from '@/hooks/useCustomDialog';
import { useInstallmentDatabase } from '@/database/models/Installment';
import { useSaleDatabase } from '@/database/models/Sale';

interface SaleItem {
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
  status: string;
}

interface SalePreviewProps {
  sale: {
    customer_name?: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    sale_date: string;
    payment_method: string;
    installments?: number;
    paidInstallments?: number;
    totalInstallments?: number;
    status?: string;
  };
  saleId: string;
  onPaymentUpdate?: () => void;
}

const PAYMENT_METHOD_LABELS: { [key: string]: string } = {
  cash: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  transfer: 'Transferência',
  installment: 'Parcelado',
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

const formatCurrencyFromNumber = (value: number): string => {
  const valueInReais = value / 100;
  return valueInReais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export default function SalePreview({ sale, saleId, onPaymentUpdate }: SalePreviewProps) {
  const router = useRouter();
  const viewShotRef = useRef<ViewShot>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPositionRef = useRef(0);
  const insets = useSafeAreaInsets();
  const dialog = useCustomDialog();
  const database = useSQLiteContext();
  const installmentDatabase = useInstallmentDatabase();
  const saleDatabase = useSaleDatabase();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(false);
  const paymentModalOpenRef = useRef(false);
  const [saleStatus, setSaleStatus] = useState<string>(sale.status || 'pending');
  const [showPaymentDateModal, setShowPaymentDateModal] = useState(false);
  const [paymentAction, setPaymentAction] = useState<{
    type: 'single' | 'installment' | 'all';
    data?: Installment;
  } | null>(null);

  useEffect(() => {
    if (sale.payment_method === 'installment') {
      loadInstallments();
    }
  }, [sale.payment_method, saleId]);

  const loadInstallments = async () => {
    try {
      setIsLoadingInstallments(true);
      const result = await database.getAllAsync<Installment>(
        `SELECT id, number, amount, due_date, payment_date, status
         FROM installments
         WHERE sale_id = ?
         ORDER BY number ASC`,
        [parseInt(saleId)]
      );
      setInstallments(result || []);
    } catch (error) {
      console.error('Error loading installments:', error);
    } finally {
      setIsLoadingInstallments(false);
    }
  };

  const handleShareImage = async () => {
    try {
      if (!viewShotRef.current) {
        dialog.showError('Erro', 'Não foi possível capturar a imagem.');
        return;
      }

      const uri = await viewShotRef.current.capture?.();

      if (!uri) {
        dialog.showError('Erro', 'Não foi possível gerar a imagem.');
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar Comprovante',
        });
      } else {
        dialog.showError('Erro', 'Compartilhamento não está disponível neste dispositivo.');
      }
    } catch (error) {
      dialog.showError('Erro', 'Não foi possível compartilhar a imagem.');
      console.error('Erro ao compartilhar imagem:', error);
    }
  };

  const handleEditSale = () => {
    router.push(`/sales/${saleId}/edit`);
  };

  const handlePayInstallment = (installment: Installment) => {
    setPaymentAction({ type: 'installment', data: installment });
    setShowPaymentDateModal(true);
  };

  const handleRevertPayment = (installment: Installment) => {
    dialog.showConfirm(
      'Reverter Pagamento',
      `Tem certeza que deseja reverter o pagamento da parcela ${installment.number}?`,
      async () => {
        try {
          await installmentDatabase.updateStatus({
            id: installment.id,
            status: 'pending',
            payment_date: null,
          });

          setInstallments(prev =>
            prev.map(inst =>
              inst.id === installment.id
                ? { ...inst, status: 'pending', payment_date: undefined }
                : inst
            )
          );

          if (onPaymentUpdate) {
            onPaymentUpdate();
          }

          dialog.showSuccess('Sucesso', 'Pagamento revertido com sucesso!');
        } catch (error) {
          console.error('Error reverting payment:', error);
          dialog.showError('Erro', 'Não foi possível reverter o pagamento.');
          await loadInstallments();
        }
      },
      dialog.hideDialog,
      'Reverter',
      'Cancelar'
    );
  };

  const handlePaymentUpdate = async () => {
    await loadInstallments();
    if (onPaymentUpdate) {
      onPaymentUpdate();
    }
  };

  const handlePayAllInstallments = () => {
    const pendingInstallments = installments.filter(inst => inst.status === 'pending');

    if (pendingInstallments.length === 0) {
      return;
    }

    setPaymentAction({ type: 'all' });
    setShowPaymentDateModal(true);
  };

  const handlePaySingleSale = () => {
    setPaymentAction({ type: 'single' });
    setShowPaymentDateModal(true);
  };

  const handleRevertSingleSale = () => {
    dialog.showConfirm(
      'Reverter Pagamento',
      'Tem certeza que deseja reverter o pagamento desta venda?',
      async () => {
        try {
          await saleDatabase.updateStatus(parseInt(saleId), 'pending');
          setSaleStatus('pending');

          if (onPaymentUpdate) {
            onPaymentUpdate();
          }

          dialog.showSuccess('Sucesso', 'Pagamento revertido com sucesso!');
        } catch (error) {
          console.error('Error reverting sale payment:', error);
          dialog.showError('Erro', 'Não foi possível reverter o pagamento.');
        }
      },
      dialog.hideDialog,
      'Reverter',
      'Cancelar'
    );
  };

  const handleCancelSale = () => {
    dialog.showConfirm(
      'Cancelar Venda',
      'Tem certeza que deseja cancelar esta venda? Esta ação pode ser revertida editando a venda.',
      async () => {
        try {
          await saleDatabase.updateStatus(parseInt(saleId), 'cancelled');
          setSaleStatus('cancelled');

          if (onPaymentUpdate) {
            onPaymentUpdate();
          }

          dialog.showSuccess('Sucesso', 'Venda cancelada com sucesso!');
        } catch (error) {
          console.error('Error cancelling sale:', error);
          dialog.showError('Erro', 'Não foi possível cancelar a venda.');
        }
      },
      dialog.hideDialog,
      'Cancelar Venda',
      'Voltar'
    );
  };

  const handleConfirmPayment = async (paymentDate: Date) => {
    setShowPaymentDateModal(false);
    const paymentDateISO = paymentDate.toISOString();

    if (!paymentAction) return;

    try {
      if (paymentAction.type === 'installment' && paymentAction.data) {
        const installment = paymentAction.data;

        await installmentDatabase.updateStatus({
          id: installment.id,
          status: 'completed',
          payment_date: paymentDateISO,
        });

        setInstallments(prev =>
          prev.map(inst =>
            inst.id === installment.id
              ? { ...inst, status: 'completed', payment_date: paymentDateISO }
              : inst
          )
        );

        if (onPaymentUpdate) {
          onPaymentUpdate();
        }

        dialog.showSuccess('Sucesso', 'Pagamento registrado com sucesso!');
      } else if (paymentAction.type === 'all') {
        const pendingInstallments = installments.filter(inst => inst.status === 'pending');
        const count = pendingInstallments.length;

        for (const installment of pendingInstallments) {
          await installmentDatabase.updateStatus({
            id: installment.id,
            status: 'completed',
            payment_date: paymentDateISO,
          });
        }

        setInstallments(prev =>
          prev.map(inst =>
            inst.status === 'pending'
              ? { ...inst, status: 'completed', payment_date: paymentDateISO }
              : inst
          )
        );

        if (onPaymentUpdate) {
          onPaymentUpdate();
        }

        dialog.showSuccess('Sucesso', `${count} parcela${count > 1 ? 's' : ''} paga${count > 1 ? 's' : ''} com sucesso!`);
      } else if (paymentAction.type === 'single') {
        await saleDatabase.updateStatus(parseInt(saleId), 'completed');

        setSaleStatus('completed');

        if (onPaymentUpdate) {
          onPaymentUpdate();
        }

        dialog.showSuccess('Sucesso', 'Pagamento registrado com sucesso!');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      dialog.showError('Erro', 'Não foi possível registrar o pagamento.');

      if (paymentAction.type !== 'single') {
        await loadInstallments();
      }
    } finally {
      setPaymentAction(null);
    }
  };

  const formatInstallmentDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 }]}
          onScroll={(event) => {
            scrollPositionRef.current = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 1.0,
            }}
            style={styles.captureContainer}
          >
            <View style={styles.previewCard}>
              {/* Header compacto */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="receipt-outline" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.title}>Comprovante</Text>
                {saleStatus === 'cancelled' && (
                  <View style={styles.cancelledBadge}>
                    <Text style={styles.cancelledBadgeText}>CANCELADA</Text>
                  </View>
                )}
              </View>
              <View style={styles.compactInfoSection}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={14} color="#64748b" />
                  <Text style={styles.infoText} numberOfLines={1}>
                    {sale.customer_name || 'Cliente não informado'}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={14} color="#64748b" />
                  <Text style={styles.infoText}>{formatDate(sale.sale_date)}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="card-outline" size={14} color="#64748b" />
                  <Text style={styles.infoText}>
                    {PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method}
                    {sale.payment_method === 'installment' && sale.totalInstallments && sale.totalInstallments > 0
                      ? `: ${sale.paidInstallments || 0}/${sale.totalInstallments}`
                      : sale.installments && sale.installments > 1
                        ? ` (${sale.installments}x)`
                        : ''}
                  </Text>
                </View>
              </View>

              {/* Lista de Produtos Compacta */}
              <View style={styles.productsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bag-outline" size={14} color="#3b82f6" />
                  <Text style={styles.sectionTitle}>Produtos</Text>
                </View>

                <View style={styles.itemsList}>
                  {sale.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.product_name}
                        </Text>
                        <Text style={styles.itemQuantity}>
                          {item.quantity}x {formatCurrencyFromNumber(item.unit_price)}
                        </Text>
                      </View>
                      <Text style={styles.itemSubtotal}>
                        {formatCurrencyFromNumber(item.subtotal)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Totais Compactos */}
              <View style={styles.totalsSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrencyFromNumber(sale.subtotal)}
                  </Text>
                </View>

                {sale.discount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.discountLabel}>Desconto</Text>
                    <Text style={styles.discountValue}>
                      -{formatCurrencyFromNumber(sale.discount)}
                    </Text>
                  </View>
                )}

                <View style={styles.divider} />

                <View style={styles.totalRow}>
                  <Text style={styles.grandTotalLabel}>Total</Text>
                  <Text style={styles.grandTotalValue}>
                    {formatCurrencyFromNumber(sale.total)}
                  </Text>
                </View>
              </View>

              <View style={styles.footer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                  <Image
                    source={require('../../assets/images/favicon.png')}
                    style={{ width: 28, height: 28, marginRight: 8, borderRadius: 6 }}
                  />
                  <Text style={{ fontWeight: '600', fontSize: 18, color: '#1e293b' }}>Top Vendas</Text>
                </View>
              </View>
            </View>
          </ViewShot>


          <TouchableOpacity
            style={styles.shareButtonInline}
            onPress={handleShareImage}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={20} color="#3b82f6" />
            <Text style={styles.shareButtonInlineText}>Compartilhar Comprovante</Text>
          </TouchableOpacity>

          {/* Seção de Parcelas */}
          {sale.payment_method === 'installment' && installments.length > 0 && (
            <View style={styles.installmentsContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="list-outline" size={18} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Parcelas</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {installments.filter(i => i.status === 'completed').length}/{installments.length} pagas
                  </Text>
                </View>
              </View>

              {/* Botão Pagar Todas */}
              {installments.some(i => i.status === 'pending') && (
                <TouchableOpacity
                  style={styles.payAllButton}
                  onPress={handlePayAllInstallments}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" />
                  <Text style={styles.payAllButtonText}>Pagar Todas as Parcelas Pendentes</Text>
                </TouchableOpacity>
              )}

              <View style={styles.installmentsList}>
                {installments.map((installment) => (
                  <View key={installment.id} style={styles.installmentRow}>
                    <View style={styles.installmentLeft}>
                      <View style={styles.installmentHeader}>
                        <Text style={styles.installmentNumber}>
                          Parcela {installment.number}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            installment.status === 'completed'
                              ? styles.statusBadgePaid
                              : styles.statusBadgePending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              installment.status === 'completed'
                                ? styles.statusBadgeTextPaid
                                : styles.statusBadgeTextPending,
                            ]}
                          >
                            {installment.status === 'completed' ? 'Paga' : 'Pendente'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.installmentDate}>
                        {installment.payment_date
                          ? `Pago em ${formatInstallmentDate(installment.payment_date)}`
                          : `Vence em ${formatInstallmentDate(installment.due_date)}`}
                      </Text>
                      <Text style={styles.installmentAmount}>
                        {formatCurrencyFromNumber(installment.amount)}
                      </Text>
                    </View>
                    <View style={styles.installmentActions}>
                      {installment.status === 'completed' ? (
                        <TouchableOpacity
                          style={styles.revertButton}
                          onPress={() => handleRevertPayment(installment)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="arrow-undo" size={18} color="#ef4444" />
                          <Text style={styles.revertButtonText}>Reverter Pagamento</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.payInstallmentButton}
                          onPress={() => handlePayInstallment(installment)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                          <Text style={styles.payInstallmentButtonText}>Pagar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>


        <View style={styles.actionsContainer}>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEditSale}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>Editar</Text>
            </TouchableOpacity>

            {sale.payment_method !== 'installment' && (
              saleStatus === 'pending' ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.payButton]}
                  onPress={handlePaySingleSale}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.actionButtonText}>Pagar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.revertSaleButton]}
                  onPress={handleRevertSingleSale}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-undo" size={18} color="#ef4444" />
                  <Text style={styles.revertSaleButtonText}>Reverter Pagamento</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {saleStatus !== 'cancelled' && (
            <TouchableOpacity
              style={styles.cancelSaleButton}
              onPress={handleCancelSale}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
              <Text style={styles.cancelSaleButtonText}>Cancelar Venda</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal de seleção de data */}
      <PaymentDateModal
        visible={showPaymentDateModal}
        onConfirm={handleConfirmPayment}
        onCancel={() => {
          setShowPaymentDateModal(false);
          setPaymentAction(null);
        }}
        title="Selecionar Data de Pagamento"
        message={paymentAction?.type === 'all'
          ? `Escolha a data de pagamento para ${installments.filter(i => i.status === 'pending').length} parcela(s) pendente(s):`
          : paymentAction?.type === 'installment' && paymentAction.data
            ? `Escolha a data de pagamento da parcela ${paymentAction.data.number}:`
            : 'Escolha a data em que o pagamento foi ou será realizado:'}
      />

      <CustomDialog
        visible={dialog.config.visible}
        title={dialog.config.title}
        message={dialog.config.message}
        icon={dialog.config.icon}
        iconColor={dialog.config.iconColor}
        buttons={dialog.config.buttons}
        onClose={dialog.hideDialog}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  captureContainer: {
    backgroundColor: '#ffffff',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  cancelledBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  shareButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  shareButtonInlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  compactInfoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  productsSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 6,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemLeft: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  totalsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  discountLabel: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
  },
  divider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3b82f6',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  payButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  revertSaleButton: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  revertSaleButtonText: {
    color: '#ea580c',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelSaleButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cancelSaleButtonText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  installmentsContainer: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  payAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 12,
    gap: 8,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  payAllButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  installmentsList: {
    gap: 8,
  },
  installmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  installmentLeft: {
    flex: 1,
    marginRight: 12,
  },
  installmentActions: {
    justifyContent: 'center',
  },
  payInstallmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  payInstallmentButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  revertButton: {
    backgroundColor: '#f97316',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  revertButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  installmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  installmentNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 8,
  },
  installmentDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  installmentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgePaid: {
    backgroundColor: '#dcfce7',
  },
  statusBadgePending: {
    backgroundColor: '#f1f5f9',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeTextPaid: {
    color: '#16a34a',
  },
  statusBadgeTextPending: {
    color: '#64748b',
  },
});
