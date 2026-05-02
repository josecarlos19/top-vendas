import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import formatCurrency from '@/components/utils/formatCurrency';

interface SaleCardProps {
  sale: {
    id: number;
    customer_name?: string;
    total: number;
    discount: number;
    payment_method: string;
    installments: number;
    status: string;
    sale_date: string;
    items_count: number;
  };
  onPress?: (sale: SaleCardProps['sale']) => void;
}

const PAYMENT_METHOD_LABELS: { [key: string]: string } = {
  money: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  transfer: 'Transferência',
  installment: 'Parcelado',
};

const STATUS_LABELS: { [key: string]: string } = {
  pending: 'Pendente',
  completed: 'Concluída',
  cancelled: 'Cancelada',
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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return '#22c55e';
    case 'pending':
      return '#f59e0b';
    case 'cancelled':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
};

const getStatusBackgroundColor = (status: string) => {
  switch (status) {
    case 'completed':
      return '#dcfce7';
    case 'pending':
      return '#fef3c7';
    case 'cancelled':
      return '#fee2e2';
    default:
      return '#f1f5f9';
  }
};

export default function SaleCard({ sale, onPress }: SaleCardProps) {
  const handlePress = () => {
    onPress?.(sale);
  };

  return (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.saleHeader}>
        <View style={styles.saleHeaderLeft}>
          {sale.customer_name && (
            <Text style={styles.customerName} numberOfLines={1}>
              {sale.customer_name}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBackgroundColor(sale.status) },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(sale.status) },
            ]}
          >
            {STATUS_LABELS[sale.status] || sale.status}
          </Text>
        </View>
      </View>

      <View style={styles.saleContent}>
        <View style={styles.saleInfo}>
          <Text style={styles.saleDetailText}>
            {formatDate(sale.sale_date)} • {PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method}
            {sale.installments > 1 && ` (${sale.installments}x)`}
          </Text>
        </View>

        <View style={styles.saleFooter}>
          <Text style={styles.itemCount}>
            {sale.items_count} {sale.items_count === 1 ? 'item' : 'itens'}
          </Text>
          <View style={styles.priceContainer}>
            {sale.discount > 0 && (
              <Text style={styles.discountAmount}>
                -{formatCurrency(sale.discount.toString())}
              </Text>
            )}
            <Text style={styles.totalAmount}>
              {formatCurrency(sale.total.toString())}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  saleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  saleHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  saleContent: {
    gap: 5,
  },
  saleInfo: {
    marginBottom: 5,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  saleDetailText: {
    fontSize: 11,
    color: '#64748b',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  itemCount: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discountAmount: {
    fontSize: 10,
    color: '#ec4899',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
});
