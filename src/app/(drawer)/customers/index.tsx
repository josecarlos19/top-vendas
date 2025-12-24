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
      <Text style={styles.emptySubtitle}>
        {searchText
          ? 'Tente ajustar os termos de busca ou limpar o filtro'
          : 'Comece cadastrando seu primeiro cliente'}
      </Text>
      {!searchText && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={() => router.push('/customers/create')}
        >
          <Ionicons
            name='person-add-outline'
            size={16}
            color='#ffffff'
            style={styles.buttonIcon}
          />
          <Text style={styles.createFirstButtonText}>
            Cadastrar primeiro cliente
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
            data={customers}
            renderItem={renderCustomer}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={[
              styles.listContainer,
              customers.length === 0 && styles.emptyListContainer,
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
          {isLoading && customers.length === 0 && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size='large' color='#FF6B35' />
              <Text style={styles.loadingOverlayText}>
                Carregando clientes...
              </Text>
            </View>
          )}

          <FloatingActionButton route='/customers/create' />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
    bottom: 20,
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
