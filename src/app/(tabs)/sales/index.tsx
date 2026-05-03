import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSaleDatabase } from '@/database/models/Sale';
import { useCustomerDatabase } from '@/database/models/Customer';
import { SaleSearchInterface } from '@/interfaces/models/saleInterface';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/SearchBar';
import SaleCard from '@/components/SaleCard';
import SalePreviewModal from '@/components/modals/SalePreviewModal';
import SalesPeriodFilter from '@/components/SalesPeriodFilter';
import CustomDialog from '@/components/modals/CustomDialog';

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
  const customerDatabase = useCustomerDatabase();

  // Configurar data padrão para os últimos 30 dias
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getDefaultEndDate = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const [startDate, setStartDate] = useState<Date | null>(getDefaultStartDate());
  const [endDate, setEndDate] = useState<Date | null>(getDefaultEndDate());
  const [dueDateStart, setDueDateStart] = useState<Date | null>(null);
  const [dueDateEnd, setDueDateEnd] = useState<Date | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState<string[]>(['pending', 'completed']);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([]);
  const [paymentDateStart, setPaymentDateStart] = useState<Date | null>(null);
  const [paymentDateEnd, setPaymentDateEnd] = useState<Date | null>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedSaleForPreview, setSelectedSaleForPreview] = useState<Sale | null>(null);

  // CustomDialog state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogIcon, setDialogIcon] = useState<any>('information-circle');
  const [dialogIconColor, setDialogIconColor] = useState('#3b82f6');
  const [dialogButtons, setDialogButtons] = useState<any[]>([]);

  const statusOptions = [
    { label: 'Pendente', value: 'pending', color: '#f59e0b' },
    { label: 'Concluída', value: 'completed', color: '#22c55e' },
    { label: 'Cancelada', value: 'cancelled', color: '#ef4444' },
  ];

  const paymentMethodOptions = [
    { label: 'Dinheiro', value: 'cash', color: '#10b981' },
    { label: 'PIX', value: 'pix', color: '#3b82f6' },
    { label: 'Parcelado', value: 'installment', color: '#8b5cf6' },
  ];

  useEffect(() => {
    if (!isFirstLoad && (startDate || endDate || dueDateStart || dueDateEnd || selectedStatus || selectedPaymentMethod.length > 0 || selectedCustomerId || paymentDateStart || paymentDateEnd)) {
      setCurrentPage(1);
      setHasMoreData(true);
      loadSales(1, false);
    }
  }, [startDate, endDate, dueDateStart, dueDateEnd, selectedStatus, selectedPaymentMethod, selectedCustomerId, paymentDateStart, paymentDateEnd]);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
      loadCustomers();
    }
  }, []);

  const loadCustomers = async () => {
    try {
      const customersData = await customerDatabase.index();
      setCustomers(
        customersData.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
        }))
      );
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

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

      if (dueDateStart) {
        searchParams.dueDateStart = dueDateStart.toISOString().split('T')[0];
      }
      if (dueDateEnd) {
        searchParams.dueDateEnd = dueDateEnd.toISOString().split('T')[0];
      }

      if (paymentDateStart) {
        searchParams.paymentDateStart = paymentDateStart.toISOString().split('T')[0];
      }
      if (paymentDateEnd) {
        searchParams.paymentDateEnd = paymentDateEnd.toISOString().split('T')[0];
      }

      if (selectedStatus.length > 0) {
        searchParams.status = selectedStatus;
      }
      if (selectedPaymentMethod.length > 0) {
        searchParams.paymentMethod = selectedPaymentMethod;
      }
      if (selectedCustomerId) {
        searchParams.customerId = selectedCustomerId;
      }

      const [data, count] = await Promise.all([
        saleDatabase.index(searchParams),
        saleDatabase.count({
          q: searchParams.q,
          startDate: searchParams.startDate,
          endDate: searchParams.endDate,
          dueDateStart: searchParams.dueDateStart,
          dueDateEnd: searchParams.dueDateEnd,
          paymentDateStart: searchParams.paymentDateStart,
          paymentDateEnd: searchParams.paymentDateEnd,
          status: searchParams.status,
          paymentMethod: searchParams.paymentMethod,
          customerId: searchParams.customerId,
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
      setDialogTitle('Erro');
      setDialogMessage('Falha ao carregar vendas');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([
        {
          text: 'OK',
          onPress: () => setDialogVisible(false),
          style: 'primary',
        },
      ]);
      setDialogVisible(true);
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

  const handleSalePress = async (sale: Sale) => {
    try {
      setSelectedSaleForPreview(sale);
      setPreviewModalVisible(true);
    } catch (error) {
      console.error('Error loading sale details:', error);
      setDialogTitle('Erro');
      setDialogMessage('Falha ao carregar detalhes da venda');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([
        {
          text: 'OK',
          onPress: () => setDialogVisible(false),
          style: 'primary',
        },
      ]);
      setDialogVisible(true);
    }
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
      onPress={() => handleSalePress(item)}
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
          onPress={() => router.push('/sales/create-wizard')}
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
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Seção de filtros */}
        <SalesPeriodFilter
          visible={showDateFilter}
          onToggle={() => setShowDateFilter(!showDateFilter)}
          startDate={startDate}
          endDate={endDate}
          dueDateStart={dueDateStart}
          dueDateEnd={dueDateEnd}
          paymentDateStart={paymentDateStart}
          paymentDateEnd={paymentDateEnd}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onDueDateStartChange={setDueDateStart}
          onDueDateEndChange={setDueDateEnd}
          onPaymentDateStartChange={setPaymentDateStart}
          onPaymentDateEndChange={setPaymentDateEnd}
          selectedStatus={selectedStatus}
          selectedPaymentMethod={selectedPaymentMethod}
          selectedCustomerId={selectedCustomerId}
          onStatusChange={setSelectedStatus}
          onPaymentMethodChange={setSelectedPaymentMethod}
          onCustomerChange={setSelectedCustomerId}
          statusOptions={statusOptions}
          paymentMethodOptions={paymentMethodOptions}
          customers={customers}
          onClear={() => {
            setStartDate(getDefaultStartDate());
            setEndDate(getDefaultEndDate());
            setDueDateStart(null);
            setDueDateEnd(null);
            setPaymentDateStart(null);
            setPaymentDateEnd(null);
            setSelectedStatus(['pending', 'completed']);
            setSelectedPaymentMethod([]);
            setSelectedCustomerId(null);
            setCurrentPage(1);
            setHasMoreData(true);
          }}
          onApply={() => {
            setCurrentPage(1);
            setHasMoreData(true);
            loadSales(1, false);
            setShowDateFilter(false);
          }}
          isLoading={isLoading}
          hasActiveFilters={
            !!(startDate || endDate || dueDateStart || dueDateEnd || paymentDateStart || paymentDateEnd || selectedStatus.length > 0 || selectedPaymentMethod.length > 0 || selectedCustomerId)
          }
        />

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

        <FloatingActionButton route='/sales/create-wizard' />
      </View>

      <SalePreviewModal
        visible={previewModalVisible}
        sale={selectedSaleForPreview}
        onClose={() => {
          setPreviewModalVisible(false);
          setSelectedSaleForPreview(null);

          loadSales();
        }}
        onPaymentUpdate={() => {
        }}
      />

      <CustomDialog
        visible={dialogVisible}
        title={dialogTitle}
        message={dialogMessage}
        icon={dialogIcon}
        iconColor={dialogIconColor}
        buttons={dialogButtons}
        onClose={() => setDialogVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
