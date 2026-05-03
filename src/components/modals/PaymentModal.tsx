import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useInstallmentDatabase } from '@/database/models/Installment';
import { useSaleDatabase } from '@/database/models/Sale';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomDialog from './CustomDialog';

interface Installment {
  id: number;
  number: number;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: string;
}

interface PaymentModalProps {
  visible: boolean;
  saleId: number;
  paymentMethod: string;
  total: number;
  onClose: () => void;
  onPaymentComplete: () => void;
}

const formatCurrency = (value: number): string => {
  const valueInReais = value / 100;
  return valueInReais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const formatDate = (dateString: string) => {
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

export default function PaymentModal({
  visible,
  saleId,
  paymentMethod,
  total,
  onClose,
  onPaymentComplete,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const [installmentToRevert, setInstallmentToRevert] = useState<Installment | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const slideAnim = useRef(new Animated.Value(1000)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const installmentDatabase = useInstallmentDatabase();
  const saleDatabase = useSaleDatabase();
  const insets = useSafeAreaInsets();
  const statusBarHeight = StatusBar.currentHeight || 0;

  useEffect(() => {
    if (visible) {
      loadPaymentData();
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      setShowConfirmDialog(false);
      setShowSuccessDialog(false);
      setShowRevertDialog(false);
      setSelectedInstallment(null);
      setInstallmentToRevert(null);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1000,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const loadPaymentData = async () => {
    if (paymentMethod === 'installment') {
      setIsLoading(true);
      try {
        const saleData = await saleDatabase.show(saleId);
        if (saleData && saleData.installments) {
          setInstallments(saleData.installments as Installment[]);
        }
      } catch (error) {
        console.error('Error loading installments:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePayInstallment = async (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentDate(new Date());
    setShowConfirmDialog(true);
  };

  const confirmInstallmentPayment = async () => {
    if (!selectedInstallment) return;

    try {
      setIsProcessing(true);
      setShowConfirmDialog(false);
      setIsLoading(true);

      await installmentDatabase.updateStatus({
        id: selectedInstallment.id,
        status: 'completed',
        payment_date: paymentDate.toISOString(),
      });

      await loadPaymentData();
      onPaymentComplete();
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
    } finally {
      setIsLoading(false);
      setSelectedInstallment(null);
      setIsProcessing(false);
    }
  };

  const handlePayFullSale = () => {
    setShowConfirmDialog(true);
  };

  const confirmFullPayment = async () => {
    try {
      setIsProcessing(true);
      setShowConfirmDialog(false);
      setIsLoading(true);

      if (paymentMethod === 'installment' && installments.length > 0) {
        for (const inst of installments) {
          if (inst.status !== 'completed') {
            await installmentDatabase.updateStatus({
              id: inst.id,
              status: 'completed',
              payment_date: paymentDate.toISOString(),
            });
          }
        }
        await loadPaymentData();
        onPaymentComplete();
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        await saleDatabase.update({
          id: saleId,
          status: 'completed',
          payment_date: paymentDate.toISOString(),
        } as any);
        setShowSuccessDialog(true);
        onPaymentComplete();
      }
    } catch (error) {
      console.error('Error completing payment:', error);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const getPendingTotal = () => {
    if (paymentMethod !== 'installment') return total;
    return installments
      .filter(inst => inst.status === 'pending')
      .reduce((sum, inst) => sum + inst.amount, 0);
  };

  const getPaidCount = () => {
    return installments.filter(inst => inst.status === 'completed').length;
  };

  const getTotalCount = () => {
    return installments.length;
  };

  const handleRevertPayment = (installment: Installment) => {
    setInstallmentToRevert(installment);
    setShowRevertDialog(true);
  };

  const confirmRevertPayment = async () => {
    if (!installmentToRevert) return;

    try {
      setIsProcessing(true);
      setIsLoading(true);
      setShowRevertDialog(false);

      await installmentDatabase.updateStatus({
        id: installmentToRevert.id,
        status: 'pending',
        payment_date: null,
      });

      await loadPaymentData();
      onPaymentComplete();

      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error reverting payment:', error);
    } finally {
      setIsLoading(false);
      setInstallmentToRevert(null);
      setIsProcessing(false);
    }
  };

  if (!visible && !isProcessing) {
    return null;
  }

  return (
    <>
      <Modal
        visible={(visible || isProcessing) && !showConfirmDialog && !showSuccessDialog && !showRevertDialog}
        transparent
        animationType="none"
        onRequestClose={isProcessing ? undefined : onClose}
        statusBarTranslucent
      >
        {/* Overlay com fade que cobre toda a tela */}
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={isProcessing ? undefined : onClose}
            disabled={isProcessing}
          />
        </Animated.View>

        {/* Modal que desliza de baixo para cima, começando após a action bar */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              top: statusBarHeight + insets.top,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="wallet" size={28} color="#22c55e" />
              </View>
              <View style={styles.headerTexts}>
                <Text style={styles.title}>Realizar Pagamento</Text>
                <Text style={styles.subtitle}>
                  {paymentMethod === 'installment'
                    ? `${getPaidCount()}/${getTotalCount()} parcelas pagas`
                    : 'Pagamento único'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={isProcessing ? undefined : onClose}
              style={styles.closeButton}
              disabled={isProcessing}
            >
              <Ionicons
                name="close"
                size={28}
                color={isProcessing ? '#cbd5e1' : '#64748b'}
              />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Processando...</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Total Pendente */}
              <View style={styles.totalCard}>
                <View style={styles.totalHeader}>
                  <Ionicons name="cash-outline" size={24} color="#f59e0b" />
                  <Text style={styles.totalLabel}>Valor Pendente</Text>
                </View>
                <Text style={styles.totalValue}>{formatCurrency(getPendingTotal())}</Text>
              </View>

              {/* Seletor de Data */}
              <View style={styles.dateSection}>
                <Text style={styles.sectionLabel}>Data do Pagamento</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={20} color="#3b82f6" />
                  <Text style={styles.dateText}>{formatDate(paymentDate.toISOString())}</Text>
                  <Ionicons name="chevron-down" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              {/* Lista de Parcelas ou Pagamento Único */}
              {paymentMethod === 'installment' ? (
                <View style={styles.installmentsSection}>
                  <Text style={styles.sectionLabel}>Parcelas</Text>
                  {installments.map((inst) => (
                    <View
                      key={inst.id}
                      style={[
                        styles.installmentCard,
                        inst.status === 'completed' && styles.installmentPaid,
                      ]}
                    >
                      <View style={styles.installmentHeader}>
                        <View style={styles.installmentNumber}>
                          <Text style={styles.installmentNumberText}>{inst.number}</Text>
                        </View>
                        <View style={styles.installmentInfo}>
                          <Text style={styles.installmentAmount}>
                            {formatCurrency(inst.amount)}
                          </Text>
                          <Text style={styles.installmentDate}>
                            {inst.status === 'completed'
                              ? `Pago em ${formatDate(inst.payment_date!)}`
                              : `Vence em ${formatDate(inst.due_date)}`}
                          </Text>
                        </View>
                      </View>

                      {inst.status === 'completed' ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            style={styles.revertButton}
                            onPress={() => handleRevertPayment(inst)}
                          >
                            <Ionicons name="arrow-undo" size={16} color="#ef4444" />
                            <Text style={styles.revertButtonText}>Reverter</Text>
                          </TouchableOpacity>
                          <View style={styles.paidBadge}>
                            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                            <Text style={styles.paidText}>Pago</Text>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.payButton}
                          onPress={() => handlePayInstallment(inst)}
                        >
                          <Ionicons name="card" size={18} color="#ffffff" />
                          <Text style={styles.payButtonText}>Pagar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.singlePaymentSection}>
                  <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#3b82f6" />
                    <Text style={styles.infoText}>
                      Ao confirmar, esta venda será marcada como paga na data selecionada.
                    </Text>
                  </View>
                </View>
              )}

              {/* Botão de Pagar Tudo (para parcelas) */}
              {paymentMethod === 'installment' && getPendingTotal() > 0 && (
                <TouchableOpacity
                  style={styles.payAllButton}
                  onPress={handlePayFullSale}
                >
                  <Ionicons name="checkmark-done" size={22} color="#ffffff" />
                  <Text style={styles.payAllButtonText}>
                    Pagar Todas as Parcelas ({formatCurrency(getPendingTotal())})
                  </Text>
                </TouchableOpacity>
              )}

              {/* Botão de Confirmar (para pagamento único) */}
              {paymentMethod !== 'installment' && (
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handlePayFullSale}
                >
                  <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                  <Text style={styles.confirmButtonText}>
                    Confirmar Pagamento
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </Animated.View>

        {/* DatePicker */}
        {showDatePicker && (
          <DateTimePicker
            value={paymentDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setPaymentDate(selectedDate);
              }
            }}
          />
        )}
      </Modal>

      {/* Diálogo de Confirmação */}
      <CustomDialog
        visible={showConfirmDialog}
        title="Confirmar Pagamento"
        message={
          selectedInstallment
            ? `Confirmar o pagamento da ${selectedInstallment.number}ª parcela no valor de ${formatCurrency(selectedInstallment.amount)}?`
            : paymentMethod === 'installment'
              ? `Confirmar o pagamento de todas as parcelas pendentes no valor total de ${formatCurrency(getPendingTotal())}?`
              : `Confirmar o pagamento no valor de ${formatCurrency(total)}?`
        }
        icon="checkmark-circle"
        iconColor="#22c55e"
        buttons={[
          {
            text: 'Cancelar',
            onPress: () => setSelectedInstallment(null),
            style: 'default',
          },
          {
            text: 'Confirmar',
            onPress: selectedInstallment ? confirmInstallmentPayment : confirmFullPayment,
            style: 'success',
          },
        ]}
        onClose={() => {
          setShowConfirmDialog(false);
          setSelectedInstallment(null);
        }}
      />

      {/* Diálogo de Sucesso */}
      <CustomDialog
        visible={showSuccessDialog}
        title="Pagamento Realizado!"
        message="O pagamento foi registrado com sucesso."
        icon="checkmark-circle"
        iconColor="#22c55e"
        buttons={[
          {
            text: 'OK',
            onPress: () => {
              setShowSuccessDialog(false);
              onClose();
            },
            style: 'success',
          },
        ]}
        onClose={() => {
          setShowSuccessDialog(false);
          onClose();
        }}
      />

      {/* Diálogo de Reversão */}
      <CustomDialog
        visible={showRevertDialog}
        title="Reverter Pagamento"
        message={
          installmentToRevert
            ? `Tem certeza que deseja reverter o pagamento da ${installmentToRevert.number}ª parcela?`
            : ''
        }
        icon="alert-circle"
        iconColor="#f59e0b"
        buttons={[
          {
            text: 'Cancelar',
            onPress: () => {
              setShowRevertDialog(false);
              setInstallmentToRevert(null);
            },
            style: 'default',
          },
          {
            text: 'Reverter',
            onPress: confirmRevertPayment,
            style: 'primary',
          },
        ]}
        onClose={() => {
          setShowRevertDialog(false);
          setInstallmentToRevert(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  content: {
    padding: 24,
  },
  totalCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#fbbf24',
  },
  totalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#92400e',
  },
  dateSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 12,
  },
  installmentsSection: {
    marginBottom: 24,
  },
  installmentCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  installmentPaid: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  installmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  installmentNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  installmentNumberText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  installmentInfo: {
    flex: 1,
  },
  installmentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  installmentDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  paidText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
    marginLeft: 4,
  },
  revertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  revertButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
    marginLeft: 4,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  },
  singlePaymentSection: {
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#dbeafe',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginLeft: 12,
  },
  payAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 14,
    paddingVertical: 18,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  payAllButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 18,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginLeft: 8,
  },
});
