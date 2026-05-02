import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CollapsibleSection from '../CollapsibleSection';

export type StockAdjustmentType = 'add' | 'remove' | 'set';

interface StockAdjustmentModalProps {
  visible: boolean;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onConfirm: (params: {
    type: StockAdjustmentType;
    quantity: number;
    notes: string;
  }) => Promise<void>;
}

export default function StockAdjustmentModal({
  visible,
  productName,
  currentStock,
  onClose,
  onConfirm,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<StockAdjustmentType>('add');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const formatNumber = (text: string) => {
    return text.replace(/\D/g, '');
  };

  const handleClose = () => {
    setQuantity('');
    setNotes('');
    setAdjustmentType('add');
    onClose();
  };

  const handleConfirm = async () => {
    const quantityValue = parseInt(quantity);

    if (!quantityValue || quantityValue <= 0) {
      Alert.alert('Erro', 'Informe uma quantidade válida para o ajuste.');
      return;
    }

    if (adjustmentType === 'remove' && quantityValue > currentStock) {
      Alert.alert(
        'Erro',
        `Não é possível remover ${quantityValue} unidades. Estoque atual: ${currentStock}`
      );
      return;
    }

    if (adjustmentType === 'set' && quantityValue === currentStock) {
      Alert.alert('Aviso', 'O estoque já está no valor informado.');
      return;
    }

    try {
      setIsSaving(true);
      await onConfirm({
        type: adjustmentType,
        quantity: quantityValue,
        notes: notes || 'Ajuste manual de estoque',
      });
      handleClose();
    } catch (error) {
      console.error('Error in modal confirm:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType='fade'
      transparent={true}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlayTouchable}
            onPress={handleClose}
          >
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajustar Estoque</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name='close' size={24} color='#666' />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.stockInfoRow}>
                  <Text style={styles.stockInfoLabel}>Produto:</Text>
                  <Text style={styles.stockInfoValue}>{productName}</Text>
                </View>

                <View style={styles.stockInfoRow}>
                  <Text style={styles.stockInfoLabel}>Estoque atual:</Text>
                  <Text style={styles.stockInfoValue}>
                    {currentStock} unidades
                  </Text>
                </View>

                <View style={styles.adjustTypeContainer}>
                  <Text style={styles.label}>Tipo de Ajuste</Text>
                  <View style={styles.adjustTypeButtons}>
                    <TouchableOpacity
                      style={[
                        styles.adjustTypeButton,
                        adjustmentType === 'add' && styles.adjustTypeButtonActive,
                      ]}
                      onPress={() => setAdjustmentType('add')}
                    >
                      <Ionicons
                        name='add-circle-outline'
                        size={20}
                        color={adjustmentType === 'add' ? '#22c55e' : '#666'}
                      />
                      <Text
                        style={[
                          styles.adjustTypeButtonText,
                          adjustmentType === 'add' && styles.adjustTypeButtonTextActive,
                        ]}
                      >
                        Adicionar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.adjustTypeButton,
                        adjustmentType === 'remove' && styles.adjustTypeButtonActive,
                      ]}
                      onPress={() => setAdjustmentType('remove')}
                    >
                      <Ionicons
                        name='remove-circle-outline'
                        size={20}
                        color={adjustmentType === 'remove' ? '#ef4444' : '#666'}
                      />
                      <Text
                        style={[
                          styles.adjustTypeButtonText,
                          adjustmentType === 'remove' && styles.adjustTypeButtonTextActive,
                        ]}
                      >
                        Remover
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.adjustTypeButton,
                        adjustmentType === 'set' && styles.adjustTypeButtonActive,
                      ]}
                      onPress={() => setAdjustmentType('set')}
                    >
                      <Ionicons
                        name='create-outline'
                        size={20}
                        color={adjustmentType === 'set' ? '#3b82f6' : '#666'}
                      />
                      <Text
                        style={[
                          styles.adjustTypeButtonText,
                          adjustmentType === 'set' && styles.adjustTypeButtonTextActive,
                        ]}
                      >
                        Definir
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Quantidade</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder='0'
                    value={quantity}
                    onChangeText={text => setQuantity(formatNumber(text))}
                    keyboardType='numeric'
                  />
                </View>

                <CollapsibleSection
                  title='Observações (opcional)'
                  icon='document-text-outline'
                  iconColor='#64748b'
                  defaultCollapsed={true}
                >
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    placeholder='Motivo do ajuste'
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </CollapsibleSection>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={handleClose}
                >
                  <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalConfirmButton,
                    (!quantity || isSaving) && styles.modalConfirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!quantity || isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size='small' color='#ffffff' />
                  ) : (
                    <Text style={styles.modalConfirmButtonText}>Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalOverlayTouchable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
  },
  modalScrollView: {
    flexShrink: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    flexGrow: 1,
  },
  stockInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  stockInfoLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  stockInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  adjustTypeContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  adjustTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  adjustTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 6,
  },
  adjustTypeButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  adjustTypeButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  adjustTypeButtonTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
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
  modalInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1e293b',
  },
  modalTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
