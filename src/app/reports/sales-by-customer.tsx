import React, { useState, useEffect } from 'react';
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
import SearchableSelect from '@/components/SearchableSelect';
import { SafeAreaView } from 'react-native-safe-area-context';
import PeriodFilter from '@/components/PeriodFilter';
import SaleCard from '@/components/SaleCard';
import SalesTotals from '@/components/SalesTotals';

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
  items_count: number;
}

interface Customer {
  id: number;
  name: string;
}

export default function SalesByCustomer() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const reportDatabase = useReportDatabase();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const result = await reportDatabase.getActiveCustomers();
      setCustomers(result);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const loadSales = async () => {
    if (!selectedCustomerId) {
      return;
    }

    try {
      setIsLoading(true);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const result = await reportDatabase.getSalesByCustomer(
        selectedCustomerId,
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

  const customerOptions = customers.map(customer => ({
    label: customer.name,
    value: customer.id,
  }));

  const totalReceived = sales
    .filter((sale) => sale.status === 'completed')
    .reduce((sum, sale) => sum + sale.total, 0);

  const totalPending = sales
    .filter((sale) => sale.status === 'pending')
    .reduce((sum, sale) => sum + sale.total, 0);

  const totalGeneral = sales
    .reduce((sum, sale) => sum + sale.total, 0);

  const totalDiscount = sales
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
          {selectedCustomerId
            ? 'Não há vendas para este cliente no período selecionado.'
            : 'Selecione um cliente e clique em Buscar.'}
        </Text>
      </View>
    );
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.filterSection}>
            <SearchableSelect
              label="Cliente"
              selectedValue={selectedCustomerId ?? undefined}
              onValueChange={(value) => setSelectedCustomerId(value as number)}
              options={customerOptions}
              placeholder="Selecione um cliente"
              enabled={!isLoadingCustomers}
            />

            <PeriodFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            <TouchableOpacity
              style={[
                styles.searchButton,
                !selectedCustomerId && styles.searchButtonDisabled,
              ]}
              onPress={loadSales}
              disabled={isLoading || !selectedCustomerId}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="search" size={16} color="#ffffff" />
                  <Text
                    style={[
                      styles.searchButtonText,
                      !selectedCustomerId && styles.searchButtonTextDisabled,
                    ]}
                  >
                    Buscar
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {sales.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsText}>
                {sales.length} venda{sales.length !== 1 ? 's' : ''} de {selectedCustomer?.name}
              </Text>
            </View>
          )}

          <View style={styles.listWrapper}>
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
        </View>

        {sales.length > 0 && !isLoading && (
          <SalesTotals
            totalReceived={totalReceived}
            totalPending={totalPending}
            totalGeneral={totalGeneral}
            totalDiscount={totalDiscount}
          />
        )}

        {isLoading && sales.length === 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingOverlayText}>Carregando vendas...</Text>
          </View>
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 16,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButtonTextDisabled: {
    color: '#94a3b8',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  resultsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingOverlayText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
});
