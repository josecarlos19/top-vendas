import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCustomerDatabase } from '@/database/models/Customer';
import { CustomerSearchInterface } from '@/interfaces/models/customerInterface';
import CustomerItem, { Customer } from '@/components/Customer/CustomerItem';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { SearchBar } from '@/components/SearchBar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const perPage = 10;
  const customerDatabase = useCustomerDatabase();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText !== undefined) {
        setCurrentPage(1);
        setHasMoreData(true);
        loadCustomers(1, false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const loadCustomers = async (page: number = 1, append: boolean = true) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const searchParams: CustomerSearchInterface = {
        page,
        perPage,
      };

      if (searchText.trim()) {
        searchParams.q = searchText.trim();
      }

      const [data, count] = await Promise.all([
        customerDatabase.index(searchParams),
        customerDatabase.count({
          q: searchParams.q,
        }),
      ]);

      if (append && page > 1) {
        setCustomers(prev => [
          ...prev,
          ...data.map((item: any) => ({
            id: item.id,
            name: item.name,
            document: item.document || undefined,
            document_type: item.document_type || undefined,
            phone: item.phone || undefined,
            mobile: item.mobile || undefined,
            email: item.email || undefined,
            address: item.address || undefined,
            neighborhood: item.neighborhood || undefined,
            city: item.city || undefined,
            state: item.state || undefined,
            zip_code: item.zip_code || undefined,
            notes: item.notes || undefined,
            active: item.active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        ]);
      } else {
        setCustomers(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            document: item.document || undefined,
            document_type: item.document_type || undefined,
            phone: item.phone || undefined,
            mobile: item.mobile || undefined,
            email: item.email || undefined,
            address: item.address || undefined,
            neighborhood: item.neighborhood || undefined,
            city: item.city || undefined,
            state: item.state || undefined,
            zip_code: item.zip_code || undefined,
            notes: item.notes || undefined,
            active: item.active,
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
      console.error('Error loading customers:', error);
      Alert.alert('Erro', 'Falha ao carregar clientes');
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
      loadCustomers(currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMoreData(true);
    loadCustomers(1, false);
  };

  const handleEdit = (customer: Customer) => {
    router.push(`/customers/${customer.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    const customer = customers.find(c => c.id === id);
    const customerName = customer?.name || 'este cliente';

    Alert.alert(
      'Confirmar exclusão',
      `Tem certeza que deseja excluir "${customerName}"? Esta ação não pode ser desfeita.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await customerDatabase.remove(id);
              setCustomers(prev => prev.filter(c => c.id !== id));
              setTotalCount(prev => prev - 1);

              Alert.alert('Sucesso', 'Cliente excluído com sucesso!');
            } catch (error) {
              console.error('Error deleting customer:', error);
              loadCustomers(1, false);
              const errorMessage = error instanceof Error ? error.message : '';
              if (
                errorMessage.includes('vendas') ||
                errorMessage.includes('FOREIGN KEY')
              ) {
                Alert.alert(
                  'Não é possível excluir',
                  'Este cliente possui vendas associadas. Para excluir o cliente, remova todas as vendas primeiro.'
                );
              } else {
                Alert.alert(
                  'Erro',
                  'Falha ao excluir cliente. Tente novamente.'
                );
              }
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers(1, false);
    }, [])
  );

  const renderCustomer = ({ item }: { item: Customer }) => (
    <CustomerItem customer={item} onEdit={handleEdit} onDelete={handleDelete} />
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
      <Ionicons name='people-outline' size={64} color='#cbd5e1' />
      <Text style={styles.emptyTitle}>Nenhum cliente encontrado</Text>
    </View>
  );

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <View style={styles.container}>
        <SearchBar
          value={searchText}
          onChangeText={handleSearch}
          placeholder='Buscar clientes...'
        />

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {totalCount} cliente{totalCount !== 1 ? 's' : ''} encontrado
            {totalCount !== 1 ? 's' : ''}
          </Text>
          {totalPages > 1 && (
            <Text style={styles.paginationText}>
              Página {currentPage} de {totalPages}
            </Text>
          )}
        </View>

        <FlatList
          data={customers}
          renderItem={renderCustomer}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
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

        <FloatingActionButton route='/customers/create' />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  paginationText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
});
