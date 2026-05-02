import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSaleDatabase } from '@/database/models/Sale';
import { SaleSearchInterface } from '@/interfaces/models/saleInterface';
import formatCurrency from '@/components/utils/formatCurrency';
import WorkArea from '@/components/WorkArea';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/SearchBar';
import SaleCard from '@/components/SaleCard';
import PeriodFilter from '@/components/PeriodFilter';
import SearchableSelect from '@/components/SearchableSelect';

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
  items_count: number;
  created_at: string;
  updated_at: string;
}

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const perPage = 10;
  const saleDatabase = useSaleDatabase();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const statusOptions = [
    { label: 'Pendente', value: 'pending' },
    { label: 'Concluída', value: 'completed' },
    { label: 'Cancelada', value: 'cancelled' },
  ];

  const paymentMethodOptions = [
    { label: 'Dinheiro', value: 'cash' },
    { label: 'PIX', value: 'pix' },
    { label: 'Parcelado', value: 'installment' },
  ];

  useEffect(() => {
    if (!isFirstLoad && (startDate || endDate || selectedStatus || selectedPaymentMethod)) {
      setCurrentPage(1);
      setHasMoreData(true);
      loadSales(1, false);
    }
  }, [startDate, endDate, selectedStatus, selectedPaymentMethod]);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText !== undefined) {
        setCurrentPage(1);
        setHasMoreData(true);
        loadSales(1, false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const loadSales = async (page: number = 1, append: boolean = true) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const searchParams: SaleSearchInterface = {
        page,
        perPage,
      };

      if (searchText.trim()) {
        searchParams.q = searchText.trim();
      }

      if (startDate) {
        searchParams.startDate = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        searchParams.endDate = endDate.toISOString().split('T')[0];
      }

      if (selectedStatus) {
        searchParams.status = selectedStatus;
      }
      if (selectedPaymentMethod) {
        searchParams.paymentMethod = selectedPaymentMethod;
      }

      const [data, count] = await Promise.all([
        saleDatabase.index(searchParams),
        saleDatabase.count({
          q: searchParams.q,
          startDate: searchParams.startDate,
          endDate: searchParams.endDate,
          status: searchParams.status,
          paymentMethod: searchParams.paymentMethod,
        }),
      ]);

      if (append && page > 1) {
        setSales(prev => [
          ...prev,
          ...data.map((item: any) => ({
            id: item.id,
            customer_id: item.customer_id || undefined,
            customer_name: item.customer_name || undefined,
            subtotal: item.subtotal,
            discount: item.discount || 0,
            total: item.total,
            payment_method: item.payment_method,
            installments: item.installments || 1,
            status: item.status,
            sale_date: item.sale_date,
            notes: item.notes || undefined,
            items: item.items || [],
            items_count: item.items?.length || 0,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        ]);
      } else {
        setSales(
          data.map((item: any) => ({
            id: item.id,
            customer_id: item.customer_id || undefined,
            customer_name: item.customer_name || undefined,
            subtotal: item.subtotal,
            discount: item.discount || 0,
            total: item.total,
            payment_method: item.payment_method,
            installments: item.installments || 1,
            status: item.status,
            sale_date: item.sale_date,
            notes: item.notes || undefined,
            items: item.items || [],
            items_count: item.items?.length || 0,
            created_at: item.created_at,
            updated_at: item.updated_at,
          }))
        );
      }

      setTotalCount(count);
      setCurrentPage(page);

      const totalPages = Math.ceil(count / perPage);
      setHasMoreData(page < totalPages);
    } catch (error) {
      console.error('Error loading sales:', error);
      Alert.alert('Erro', 'Falha ao carregar vendas');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const loadMore = () => {
    if (hasMoreData && !isLoadingMore && !isLoading) {
      loadSales(currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMoreData(true);
    loadSales(1, false);
  };

  const pushToSale = (sale: Sale) => {
    router.push(`/sales/${sale.id}/edit`);
  };

  useFocusEffect(
    useCallback(() => {
      loadSales(1, false);
    }, [startDate, endDate, selectedStatus, selectedPaymentMethod, searchText])
  );

  const renderSale = ({ item }: { item: Sale }) => (
    <SaleCard
      sale={item}
      onPress={() => pushToSale(item)}
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size='small' color='#FF6B35' />
        <Text style={styles.loadingText}>Carregando mais...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name='receipt-outline' size={64} color='#cbd5e1' />
      <Text style={styles.emptyTitle}>Nenhuma venda encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {searchText
          ? 'Tente ajustar os termos de busca ou limpar o filtro'
          : 'Comece registrando sua primeira venda'}
      </Text>
      {!searchText && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={() => router.push('/sales/create')}
        >
          <Ionicons
            name='add-outline'
            size={16}
            color='#ffffff'
            style={styles.buttonIcon}
          />
          <Text style={styles.createFirstButtonText}>
            Registrar primeira venda
          </Text>
        </TouchableOpacity>
      )}
      {searchText && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => handleSearch('')}
        >
          <Ionicons
            name='refresh-outline'
            size={16}
            color='#FF6B35'
            style={styles.buttonIcon}
          />
          <Text style={styles.clearSearchButtonText}>Limpar busca</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Seção de filtros */}
        <View style={styles.filterSection}>
          {/* Botão para mostrar/ocultar filtro de data */}
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setShowDateFilter(!showDateFilter)}
          >
            <Ionicons
              name={showDateFilter ? 'chevron-up' : 'chevron-down'}
              size={20}
              color='#64748b'
            />
            <Text style={styles.filterToggleText}>
              Filtrar por período
            </Text>
            {(startDate || endDate || selectedStatus || selectedPaymentMethod) && (
              <View style={styles.filterActiveBadge}>
                <Ionicons name='checkmark-circle' size={16} color='#22c55e' />
              </View>
            )}
          </TouchableOpacity>

          {/* PeriodFilter - mostrado condicionalmente */}
          {showDateFilter && (
            <View style={styles.periodFilterContainer}>
              <PeriodFilter
                startDate={startDate || new Date()}
                endDate={endDate || new Date()}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />

              {/* Filtros adicionais */}
              <SearchableSelect
                label="Status"
                selectedValue={selectedStatus ?? undefined}
                onValueChange={(value) => setSelectedStatus(value as string)}
                options={statusOptions}
                placeholder="Todos os status"
              />

              <SearchableSelect
                label="Forma de Pagamento"
                selectedValue={selectedPaymentMethod ?? undefined}
                onValueChange={(value) => setSelectedPaymentMethod(value as string)}
                options={paymentMethodOptions}
                placeholder="Todas as formas"
              />

              {/* Botões de ação */}
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={() => {
                    setStartDate(null);
                    setEndDate(null);
                    setSelectedStatus(null);
                    setSelectedPaymentMethod(null);
                    setCurrentPage(1);
                    setHasMoreData(true);
                  }}
                  disabled={!startDate && !endDate && !selectedStatus && !selectedPaymentMethod}
                >
                  <Ionicons name='close-circle-outline' size={16} color={(!startDate && !endDate && !selectedStatus && !selectedPaymentMethod) ? '#cbd5e1' : '#64748b'} />
                  <Text style={[styles.clearFilterButtonText, (!startDate && !endDate && !selectedStatus && !selectedPaymentMethod) && styles.disabledText]}>
                    Limpar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyFilterButton}
                  onPress={() => {
                    setCurrentPage(1);
                    setHasMoreData(true);
                    loadSales(1, false);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color='#ffffff' size='small' />
                  ) : (
                    <>
                      <Ionicons name='search' size={16} color='#ffffff' />
                      <Text style={styles.applyFilterButtonText}>Buscar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <SearchBar
          value={searchText}
          onChangeText={handleSearch}
          placeholder='Buscar vendas...'
        />

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {totalCount} venda{totalCount !== 1 ? 's' : ''} encontrada
            {totalCount !== 1 ? 's' : ''}
            {searchText && (
              <Text style={styles.searchIndicator}> para "{searchText}"</Text>
            )}
          </Text>
          {totalPages > 1 && (
            <Text style={styles.paginationText}>
              Página {currentPage} de {totalPages}
            </Text>
          )}
        </View>

        <FlatList
          data={sales}
          renderItem={renderSale}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            sales.length === 0 && styles.emptyListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              colors={['#FF6B35']}
              tintColor='#FF6B35'
            />
          }
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
        />
        {isLoading && sales.length === 0 && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size='large' color='#FF6B35' />
            <Text style={styles.loadingOverlayText}>Carregando vendas...</Text>
          </View>
        )}

        <FloatingActionButton route='/sales/create' />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  filterSection: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  filterActiveBadge: {
    marginLeft: 'auto',
  },
  periodFilterContainer: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  clearFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  clearFilterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  disabledText: {
    color: '#cbd5e1',
  },
  applyFilterButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: 6,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  applyFilterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    paddingHorizontal: 20,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
  },
  searchIndicator: {
    fontWeight: '400',
    fontStyle: 'italic',
  },
  paginationText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
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
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  createFirstButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearSearchButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    marginTop: 12,
  },
  clearSearchButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 4,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 50,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
