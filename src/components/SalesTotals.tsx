import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SalesTotalsProps {
  totalReceived: number;
  totalPending: number;
  totalGeneral: number;
  totalDiscount: number;
}

export default function SalesTotals({
  totalReceived,
  totalPending,
  totalGeneral,
  totalDiscount,
}: SalesTotalsProps) {
  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.totalsContainer}>
      <View style={styles.totalRow}>
        <View style={styles.totalItem}>
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>Total Recebido</Text>
            <Text style={[styles.totalValue, { color: '#22c55e' }]}>
              {formatCurrency(totalReceived)}
            </Text>
          </View>
        </View>

        <View style={styles.totalItem}>
          <Ionicons name="time" size={18} color="#f59e0b" />
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>A Receber</Text>
            <Text style={[styles.totalValue, { color: '#f59e0b' }]}>
              {formatCurrency(totalPending)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.totalRow}>
        <View style={styles.totalItem}>
          <Ionicons name="cash" size={18} color="#3b82f6" />
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>Total Geral</Text>
            <Text style={[styles.totalValue, { color: '#3b82f6' }]}>
              {formatCurrency(totalGeneral)}
            </Text>
          </View>
        </View>

        <View style={styles.totalItem}>
          <Ionicons name="pricetag" size={18} color="#ec4899" />
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>Total Desconto</Text>
            <Text style={[styles.totalValue, { color: '#ec4899' }]}>
              {formatCurrency(totalDiscount)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  totalsContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  totalRow: {
    flexDirection: 'row',
    gap: 10,
  },
  totalItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '700',
  },
});
