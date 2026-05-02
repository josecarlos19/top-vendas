import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useReportDatabase } from '@/database/models/Report';
import { SafeAreaView } from 'react-native-safe-area-context';
import PeriodFilter from '@/components/PeriodFilter';
import SaleCard from '@/components/SaleCard';

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
  items_count: number;
}

export default function SalesByPeriod() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const reportDatabase = useReportDatabase();

  const loadSales = async () => {
    try {
      setIsLoading(true);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const result = await reportDatabase.getSalesByPeriod(
        startDateStr,
        endDateStr
      );
      setSales(result);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pushToSale = (sale: { id: number }) => {
    router.push(`/sales/${sale.id}/edit`);
  };

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
    <SaleCard sale={item} onPress={pushToSale} />
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
                <Ionicons name="search" size={16} color="#ffffff" />
                <Text style={styles.searchButtonText}>Buscar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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

      {sales.length > 0 && !isLoading && (
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
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
              <Ionicons name="time" size={18} color="#f59e0b" />
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
              <Ionicons name="cash" size={18} color="#3b82f6" />
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
              <Ionicons name="pricetag" size={18} color="#ec4899" />
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 6,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  resultsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultsText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  totalsContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 6,
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
