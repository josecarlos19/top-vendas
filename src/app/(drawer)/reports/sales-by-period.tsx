import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSaleDatabase } from '@/database/models/Sale';
import formatCurrency from '@/components/utils/formatCurrency';
import { SafeAreaView } from 'react-native-safe-area-context';
import PeriodFilter from '@/components/PeriodFilter';

interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  installments: number;
  status: string;
  sale_date: string;
  notes?: string;
  items?: any[];
  created_at: string;
  updated_at: string;
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

export default function SalesByPeriod() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primeiro dia do mês atual
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const saleDatabase = useSaleDatabase();

  const loadSales = async () => {
    try {
      setIsLoading(true);

      // Buscar todas as vendas sem paginação
      const allSales = await saleDatabase.index();

      // Filtrar vendas por período
      const filteredSales = allSales
        .filter((sale) => {
          // Verificar se sale_date existe
          if (!sale.sale_date) {
            return false;
          }

          const saleDate = new Date(sale.sale_date);
          const start = new Date(startDate);
          const end = new Date(endDate);

          // Normalizar para comparar apenas datas (sem hora)
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          saleDate.setHours(0, 0, 0, 0);

          return saleDate >= start && saleDate <= end;
        })
        .map((sale) => ({
          id: sale.id!,
          customer_id: sale.customer_id,
          customer_name: sale.customer_name,
          subtotal: sale.subtotal || 0,
          discount: sale.discount || 0,
          total: sale.total || 0,
          payment_method: sale.payment_method || 'money',
          installments: sale.installments || 1,
          status: sale.status || 'pending',
          sale_date: sale.sale_date!.toString(),
          notes: sale.notes,
          items: sale.items,
          created_at: sale.created_at?.toString() || '',
          updated_at: sale.updated_at?.toString() || '',
        }));

      setSales(filteredSales);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setIsLoading(false);
    }
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

  const pushToSale = (sale: Sale) => {
    router.push(`/sales/${sale.id}/edit`);
  };

  // Calcular totais
  const totalReceived = sales
    .filter((sale) => sale.status === 'completed')
    .reduce((sum, sale) => sum + sale.total, 0);

  const totalPending = sales
    .filter((sale) => sale.status === 'pending')
    .reduce((sum, sale) => sum + sale.total, 0);

  const totalGeneral = sales
    .filter((sale) => sale.status !== 'cancelled')
    .reduce((sum, sale) => sum + sale.total, 0);

  const totalDiscount = sales
    .filter((sale) => sale.status !== 'cancelled')
    .reduce((sum, sale) => sum + sale.discount, 0);

  const renderSale = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => pushToSale(item)}
      activeOpacity={0.7}
    >
      <View style={styles.saleHeader}>
        <View style={styles.saleHeaderLeft}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusBackgroundColor(item.status) },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.saleContent}>
        {item.customer_name && (
          <View style={styles.customerInfo}>
            <Ionicons name="person-outline" size={16} color="#64748b" />
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>
        )}

        <View style={styles.saleDetails}>
          <View style={styles.saleDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.saleDetailText}>
              {formatDate(item.sale_date)}
            </Text>
          </View>

          <View style={styles.saleDetailRow}>
            <Ionicons name="card-outline" size={16} color="#64748b" />
            <Text style={styles.saleDetailText}>
              {PAYMENT_METHOD_LABELS[item.payment_method] ||
                item.payment_method}
              {item.installments > 1 && ` (${item.installments}x)`}
            </Text>
          </View>

          <View style={styles.saleDetailRow}>
            <Ionicons name="bag-outline" size={16} color="#64748b" />
            <Text style={styles.saleDetailText}>
              {item.items?.length || 0} item
              {(item.items?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.saleFooter}>
          {item.discount > 0 && (
            <View style={styles.discountInfo}>
              <Text style={styles.originalTotal}>
                {formatCurrency(item.subtotal.toString())}
              </Text>
              <Text style={styles.discountAmount}>
                -{formatCurrency(item.discount.toString())}
              </Text>
            </View>
          )}
          <Text style={styles.totalAmount}>
            {formatCurrency(item.total.toString())}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyState}>
        <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
        <Text style={styles.emptyTitle}>Nenhuma venda encontrada</Text>
        <Text style={styles.emptySubtitle}>
          Não há vendas no período selecionado.{'\n'}
          Tente selecionar outras datas.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filtros e Conteúdo */}
      <View style={styles.content}>
        <View style={styles.filterSection}>
          <PeriodFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={loadSales}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Ionicons name="search" size={20} color="#ffffff" />
                <Text style={styles.searchButtonText}>Buscar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Lista de Vendas */}
        {sales.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {sales.length} venda{sales.length !== 1 ? 's' : ''} encontrada
              {sales.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        <FlatList
          data={sales}
          renderItem={renderSale}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            sales.length === 0 && styles.emptyListContainer,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Totalizadores Fixos */}
      {sales.length > 0 && !isLoading && (
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>Total Recebido</Text>
                <Text style={[styles.totalValue, { color: '#22c55e' }]}>
                  {(totalReceived / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.totalItem}>
              <Ionicons name="time" size={20} color="#f59e0b" />
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>A Receber</Text>
                <Text style={[styles.totalValue, { color: '#f59e0b' }]}>
                  {(totalPending / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Ionicons name="cash" size={20} color="#3b82f6" />
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>Total Geral</Text>
                <Text style={[styles.totalValue, { color: '#3b82f6' }]}>
                  {(totalGeneral / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.totalItem}>
              <Ionicons name="pricetag" size={20} color="#ec4899" />
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>Total Desconto</Text>
                <Text style={[styles.totalValue, { color: '#ec4899' }]}>
                  {(totalDiscount / 100).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Loading Overlay */}
      {isLoading && sales.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingOverlayText}>Carregando vendas...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 12,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  saleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saleContent: {
    gap: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  saleDetails: {
    gap: 8,
  },
  saleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saleDetailText: {
    fontSize: 14,
    color: '#64748b',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  discountInfo: {
    alignItems: 'flex-start',
  },
  originalTotal: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  discountAmount: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  totalsContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  totalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  totalItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalInfo: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
