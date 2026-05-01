import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { useSaleDatabase } from '@/database/models/Sale';
import { useCustomerDatabase } from '@/database/models/Customer';
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

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  active: number;
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

export default function SalesByCustomer() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primeiro dia do mês atual
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const saleDatabase = useSaleDatabase();
  const customerDatabase = useCustomerDatabase();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const allCustomers = await customerDatabase.index();
      // Filtrar apenas clientes ativos e converter para o tipo Customer
      const activeCustomers = allCustomers
        .filter((customer) => customer.active === 1 && customer.id !== undefined)
        .map((customer) => ({
          id: customer.id!,
          name: customer.name || '',
          email: customer.email,
          phone: customer.phone,
          mobile: customer.mobile,
          active: customer.active || 1,
        }));
      setCustomers(activeCustomers);
    } catch (error) {
      // Error silently handled
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

      // Buscar todas as vendas sem paginação
      const allSales = await saleDatabase.index();

      // Filtrar vendas por cliente e período
      const filteredSales = allSales
        .filter((sale) => {
          // Filtro por cliente
          if (sale.customer_id !== selectedCustomerId) {
            return false;
          }

          // Verificar se sale_date existe
          if (!sale.sale_date) {
            return false;
          }

          // Filtro por período
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
      // Error silently handled
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
        return '#64748b';
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

  const pushToSale = (id: number) => {
    router.push(`/sales/${id}/edit`);
  };

  // Cálculos dos totais
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
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => pushToSale(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.saleHeader}>
        <Text style={styles.saleDate}>{formatDate(item.sale_date)}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBackgroundColor(item.status) },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {STATUS_LABELS[item.status] || item.status}
          </Text>
        </View>
      </View>

      <View style={styles.saleContent}>
        <View style={styles.saleInfo}>
          <Text style={styles.paymentMethod}>
            {PAYMENT_METHOD_LABELS[item.payment_method] || item.payment_method}
          </Text>
          {item.notes && (
            <Text style={styles.saleNotes} numberOfLines={1}>
              {item.notes}
            </Text>
          )}
        </View>

        <View style={styles.saleFooter}>
          <View style={styles.priceContainer}>
            {item.discount > 0 && (
              <Text style={styles.discountAmount}>
                -{formatCurrency((item.discount / 100).toString())}
              </Text>
            )}
            <Text style={styles.totalAmount}>
              {formatCurrency((item.total / 100).toString())}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nenhuma venda encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {selectedCustomerId
          ? 'Não há vendas para este cliente no período selecionado.'
          : 'Selecione um cliente e clique em "Buscar" para ver as vendas.'}
      </Text>
    </View>
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Content */}
      <View style={styles.content}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Filter Section */}
          <View style={styles.filterSection}>
            <PeriodFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            {/* Customer Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Cliente</Text>
              {isLoadingCustomers ? (
                <View style={styles.pickerLoading}>
                  <ActivityIndicator size="small" color="#3b82f6" />
                  <Text style={styles.pickerLoadingText}>Carregando clientes...</Text>
                </View>
              ) : (
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedCustomerId}
                    onValueChange={(value) => setSelectedCustomerId(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Selecione um cliente" value={null} />
                    {customers.map((customer) => (
                      <Picker.Item
                        key={customer.id}
                        label={customer.name}
                        value={customer.id}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            </View>

            {/* Search Button */}
            <TouchableOpacity
              style={[
                styles.searchButton,
                !selectedCustomerId && styles.searchButtonDisabled,
              ]}
              onPress={loadSales}
              activeOpacity={0.7}
              disabled={!selectedCustomerId || isLoading}
            >
              <Ionicons
                name="search"
                size={16}
                color={!selectedCustomerId ? '#94a3b8' : '#ffffff'}
              />
              <Text
                style={[
                  styles.searchButtonText,
                  !selectedCustomerId && styles.searchButtonTextDisabled,
                ]}
              >
                {isLoading ? 'Buscando...' : 'Buscar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Results */}
          {sales.length > 0 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsText}>
                {sales.length} {sales.length === 1 ? 'venda encontrada' : 'vendas encontradas'}
              </Text>
            </View>
          )}

          {/* Sales List */}
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
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      </View>

      {/* Totals Footer */}
      {sales.length > 0 && (
        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <View style={styles.totalItem}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <View style={styles.totalInfo}>
                <Text style={styles.totalLabel}>Total Recebido</Text>
                <Text
                  style={[styles.totalValue, { color: '#22c55e' }]}
                >
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
                <Text
                  style={[styles.totalValue, { color: '#f59e0b' }]}
                >
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
                <Text
                  style={[styles.totalValue, { color: '#3b82f6' }]}
                >
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
                <Text
                  style={[styles.totalValue, { color: '#ec4899' }]}
                >
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
      {isLoading && (
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
  scrollContent: {
    flexGrow: 1,
  },
  filterSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 6,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  pickerWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  picker: {
    height: 40,
  },
  pickerLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  pickerLoadingText: {
    fontSize: 12,
    color: '#64748b',
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
  searchButtonDisabled: {
    backgroundColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  searchButtonTextDisabled: {
    color: '#94a3b8',
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
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
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
  saleDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
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
    gap: 3,
  },
  paymentMethod: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  saleNotes: {
    fontSize: 10,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
});
