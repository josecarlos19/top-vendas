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
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useProductDatabase } from '@/database/models/Product';
import { useCategoryDatabase } from '@/database/models/Category';
import { ProductSearchInterface } from '@/interfaces/models/productInterface';
import ProductCard from '@/components/ProductCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingActionButton, ActionButton } from '@/components/FloatingActionButton';
import { SearchBar } from '@/components/SearchBar';
import StockAdjustmentModal, { StockAdjustmentType } from '@/components/modals/StockAdjustmentModal';
import { useSQLiteContext } from 'expo-sqlite';
import { useCustomDialog } from '@/hooks/useCustomDialog';
import CustomDialog from '@/components/modals/CustomDialog';

interface Product {
  id: number;
  name: string;
  barcode?: string;
  reference?: string;
  description?: string;
  cost_price: number;
  sale_price: number;
  wholesale_price?: number;
  initial_stock: number;
  current_stock: number;
  minimum_stock?: number;
  category_id?: number;
  category_name?: string;
  supplier?: string;
  active: number;
  created_at?: string;
  updated_at?: string;
}

export default function ProductsList() {
  const dialog = useCustomDialog();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    number | undefined
  >();
  const [showLowStock, setShowLowStock] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const perPage = 10;
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const productDatabase = useProductDatabase();
  const categoryDatabase = useCategoryDatabase();
  const database = useSQLiteContext();

  useEffect(() => {
    loadCategories();
    clearSearchParams();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText !== undefined) {
        setCurrentPage(1);
        setHasMoreData(true);
        loadProducts(1, false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, selectedCategory, showLowStock, showInactive]);

  const loadCategories = async () => {
    try {
      const data = await categoryDatabase.index({ active: 1 });
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const clearSearchParams = () => {
    setSearchText('');
    setSelectedCategory(undefined);
    setShowLowStock(false);
    setShowInactive(false);
    setCurrentPage(1);
  };

  const loadProducts = async (page: number = 1, append: boolean = true) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const searchParams: ProductSearchInterface = {
        page,
        perPage,
      };

      if (searchText.trim()) {
        searchParams.q = searchText.trim();
      }

      if (selectedCategory) {
        searchParams.category_id = selectedCategory;
      }

      if (showLowStock) {
        searchParams.low_stock = true;
      }

      if (!showInactive) {
        searchParams.active = 1;
      }

      const [data, count] = await Promise.all([
        productDatabase.index(searchParams),
        productDatabase.count({
          q: searchParams.q,
          category_id: searchParams.category_id,
          low_stock: searchParams.low_stock,
          active: searchParams.active,
        }),
      ]);

      if (append && page > 1) {
        setProducts(prev => [
          ...prev,
          ...data.map((item: any) => ({
            id: item.id,
            name: item.name,
            barcode: item.barcode,
            reference: item.reference,
            description: item.description,
            cost_price: item.cost_price,
            sale_price: item.sale_price,
            wholesale_price: item.wholesale_price,
            initial_stock: item.initial_stock,
            current_stock: item.current_stock,
            minimum_stock: item.minimum_stock,
            category_id: item.category_id,
            category_name: item.category_name,
            supplier: item.supplier,
            active: item.active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        ]);
      } else {
        setProducts(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            barcode: item.barcode,
            reference: item.reference,
            description: item.description,
            cost_price: item.cost_price,
            sale_price: item.sale_price,
            wholesale_price: item.wholesale_price,
            initial_stock: item.initial_stock,
            current_stock: item.current_stock,
            minimum_stock: item.minimum_stock,
            category_id: item.category_id,
            category_name: item.category_name,
            supplier: item.supplier,
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
      console.error('Error loading products:', error);
      dialog.showError('Erro', 'Falha ao carregar produtos');
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
      loadProducts(currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMoreData(true);
    loadProducts(1, false);
  };

  const handleEdit = (product: { id: number }) => {
    router.push(`/products/${product.id}/edit`);
  };

  const handleStockAdjust = (product: any) => {
    setSelectedProduct(product as Product);
    setShowStockAdjustModal(true);
  };

  const handleStockAdjustConfirm = async (params: {
    type: StockAdjustmentType;
    quantity: number;
    notes: string;
  }) => {
    if (!selectedProduct) return;

    try {
      let quantity = params.quantity;
      let type = params.type;
      let notes = params.notes;

      if (type === 'set') {
        const currentStockValue = selectedProduct.current_stock || 0;
        const difference = quantity - currentStockValue;

        if (difference > 0) {
          type = 'add';
          quantity = difference;
        } else if (difference < 0) {
          type = 'remove';
          quantity = Math.abs(difference);
        } else {
          return;
        }
      }

      await database.runAsync(
        `INSERT INTO stock_movements (
          sale_id, product_id, type, quantity, unit_value, total_value, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [null, selectedProduct.id, type, quantity, selectedProduct.sale_price, 0, notes]
      );

      dialog.showSuccess('Sucesso', 'Estoque ajustado com sucesso!');
      setShowStockAdjustModal(false);
      setSelectedProduct(null);
      handleRefresh();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      dialog.showError('Erro', 'Falha ao ajustar estoque. Tente novamente.');
    }
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setShowLowStock(false);
    setShowInactive(false);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory) {
      count++;
    }
    if (showLowStock) {
      count++;
    }
    if (showInactive) {
      count++;
    }
    return count;
  };

  useEffect(() => {
    if (!isFirstLoad && (selectedCategory || showLowStock || showInactive)) {
      setCurrentPage(1);
      setHasMoreData(true);
      loadProducts(1, false);
    }
  }, [selectedCategory, showLowStock, showInactive]);

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts(1, false);
    }, [selectedCategory, showLowStock, showInactive, searchText])
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      onPress={handleEdit}
      onStockAdjust={handleStockAdjust}
      showStockAction={true}
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
      <Ionicons name='bag-outline' size={64} color='#cbd5e1' />
      <Text style={styles.emptyTitle}>Nenhum produto encontrado</Text>
      <Text style={styles.emptySubtitle}>
        {searchText || selectedCategory || showLowStock
          ? 'Tente ajustar os filtros de busca'
          : 'Comece cadastrando seu primeiro produto'}
      </Text>
      {!searchText && !selectedCategory && !showLowStock && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={() => router.push('/products/create')}
        >
          <Text style={styles.createFirstButtonText}>
            Cadastrar primeiro produto
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType='slide'
      presentationStyle='fullScreen'
      onRequestClose={() => setShowFilters(false)}
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filtros</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Ionicons name='close' size={24} color='#64748b' />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categoria</Text>
            <View style={styles.categoryFilters}>
              <TouchableOpacity
                style={[
                  styles.categoryFilter,
                  !selectedCategory && styles.categoryFilterActive,
                ]}
                onPress={() => setSelectedCategory(undefined)}
              >
                <Text
                  style={[
                    styles.categoryFilterText,
                    !selectedCategory && styles.categoryFilterTextActive,
                  ]}
                >
                  Todas
                </Text>
              </TouchableOpacity>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryFilter,
                    selectedCategory === category.id &&
                    styles.categoryFilterActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory(
                      selectedCategory === category.id ? undefined : category.id
                    )
                  }
                >
                  <Text
                    style={[
                      styles.categoryFilterText,
                      selectedCategory === category.id &&
                      styles.categoryFilterTextActive,
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Estoque</Text>
            <TouchableOpacity
              style={[
                styles.toggleFilter,
                showLowStock && styles.toggleFilterActive,
              ]}
              onPress={() => setShowLowStock(!showLowStock)}
            >
              <Ionicons
                name={showLowStock ? 'checkbox' : 'square-outline'}
                size={20}
                color={showLowStock ? '#FF6B35' : '#64748b'}
              />
              <Text style={styles.toggleFilterText}>
                Apenas produtos com estoque baixo
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Status</Text>
            <TouchableOpacity
              style={[
                styles.toggleFilter,
                showInactive && styles.toggleFilterActive,
              ]}
              onPress={() => setShowInactive(!showInactive)}
            >
              <Ionicons
                name={showInactive ? 'checkbox' : 'square-outline'}
                size={20}
                color={showInactive ? '#FF6B35' : '#64748b'}
              />
              <Text style={styles.toggleFilterText}>
                Incluir produtos inativos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <SafeAreaView style={styles.modalActions} edges={['bottom']}>
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearFilters}
          >
            <Text style={styles.clearFiltersButtonText}>Limpar Filtros</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyFiltersButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </SafeAreaView>
    </Modal>
  );

  const totalPages = Math.ceil(totalCount / perPage);
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <SearchBar
          value={searchText}
          onChangeText={handleSearch}
          placeholder='Buscar por nome, código, referência...'
          showFilters={true}
          activeFiltersCount={activeFiltersCount}
          onFilterPress={() => setShowFilters(true)}
        />

        <ActionButton
          route="/products/create"
          label="Novo Produto"
        />

        <View style={styles.resultsContainer}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#eff6ff',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: '#3b82f6',
            }}
            onPress={() => router.push('/categories')}
          >
            <Ionicons name='pricetags-outline' size={20} color='#3b82f6' style={{ marginRight: 6 }} />
            <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 14 }}>
              Gerenciar Categorias
            </Text>
          </TouchableOpacity>
          <Text style={styles.resultsText}>
            {totalCount} produto{totalCount !== 1 ? 's' : ''} encontrado
            {totalCount !== 1 ? 's' : ''}
          </Text>
          {totalPages > 1 && (
            <Text style={styles.paginationText}>
              Página {currentPage} de {totalPages}
            </Text>
          )}
        </View>

        <FlatList
          data={products}
          renderItem={renderProduct}
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
      </View>

      {renderFiltersModal()}

      {/* Modal de Ajuste Rápido de Estoque */}
      <StockAdjustmentModal
        visible={showStockAdjustModal}
        productName={selectedProduct?.name || ''}
        currentStock={selectedProduct?.current_stock || 0}
        onClose={() => {
          setShowStockAdjustModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleStockAdjustConfirm}
      />

      <CustomDialog
        visible={dialog.config.visible}
        title={dialog.config.title}
        message={dialog.config.message}
        icon={dialog.config.icon}
        iconColor={dialog.config.iconColor}
        buttons={dialog.config.buttons}
        onClose={dialog.hideDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
    fontSize: 14,
    color: '#1e293b',
  },
  filterButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
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
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  createFirstButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  createFirstButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryFilter: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryFilterActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryFilterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  categoryFilterTextActive: {
    color: '#ffffff',
  },
  toggleFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  toggleFilterActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#fff5f0',
  },
  toggleFilterText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
