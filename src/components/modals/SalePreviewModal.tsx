import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import SalePreview from '@/components/SalePreview';

interface SalePreviewModalProps {
  visible: boolean;
  sale: {
    id: number;
    customer_name?: string;
    items?: any[];
    subtotal: number;
    discount: number;
    total: number;
    sale_date: string;
    payment_method: string;
    installments: number;
    status?: string;
  } | null;
  onClose: () => void;
  onPaymentUpdate?: () => void;
}

export default function SalePreviewModal({ visible, sale, onClose, onPaymentUpdate }: SalePreviewModalProps) {
  const database = useSQLiteContext();
  const [paidInstallments, setPaidInstallments] = useState(0);
  const [totalInstallments, setTotalInstallments] = useState(0);
  const [isLoadingInstallments, setIsLoadingInstallments] = useState(true);

  useEffect(() => {
    if (visible && sale && sale.payment_method === 'installment') {
      loadInstallmentsInfo();
    } else {
      setPaidInstallments(0);
      setTotalInstallments(0);
      setIsLoadingInstallments(false);
    }
  }, [visible, sale]);

  async function loadInstallmentsInfo() {
    try {
      setIsLoadingInstallments(true);
      const result = await database.getFirstAsync(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as paid
         FROM installments
         WHERE sale_id = ?`,
        [sale!.id]
      ) as { total: number; paid: number } | null;

      if (result) {
        setTotalInstallments(result.total || 0);
        setPaidInstallments(result.paid || 0);
      }
    } catch (error) {
      console.error('Error loading installments info:', error);
    } finally {
      setIsLoadingInstallments(false);
    }
  }

  if (!sale) return null;

  const saleWithItems = {
    ...sale,
    items: sale.items || [],
    paidInstallments,
    totalInstallments,
    status: sale.status,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#64748b" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalhes da Venda</Text>
            <View style={styles.placeholder} />
          </View>

          {isLoadingInstallments && sale.payment_method === 'installment' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.loadingText}>Carregando informações...</Text>
            </View>
          ) : (
            <SalePreview
              sale={saleWithItems}
              saleId={String(sale.id)}
              onPaymentUpdate={async () => {
                await loadInstallmentsInfo();
                onPaymentUpdate?.();
              }}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  placeholder: {
    width: 36,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
});
