import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCategoryDatabase } from '@/database/models/Category';
import { CategorySearchInterface } from '@/interfaces/models/categoryInterface';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryCard from '@/components/CategoryCard';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { SearchBar } from '@/components/SearchBar';

interface Category {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const perPage = 10;
  const categoryDatabase = useCategoryDatabase();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText !== undefined) {
        setCurrentPage(1);
        setHasMoreData(true);
        loadCategories(1, false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const loadCategories = async (page: number = 1, append: boolean = true) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const searchParams: CategorySearchInterface = {
        page,
        perPage,
      };

      if (searchText.trim()) {
        searchParams.name = searchText.trim();
      }

      const [data, count] = await Promise.all([
        categoryDatabase.index(searchParams),
        categoryDatabase.count({
          name: searchParams.name,
        }),
      ]);

      if (append && page > 1) {
        setCategories(prev => [
          ...prev,
          ...data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            active: item.active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        ]);
      } else {
        setCategories(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
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
      console.error('Error loading categories:', error);
      Alert.alert('Erro', 'Falha ao carregar categorias');
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
      loadCategories(currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMoreData(true);
    loadCategories(1, false);
  };

  const pushToCategory = (category: Category) => {
    router.push(`/categories/${category.id}/edit`);
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories(1, false);
    }, [searchText])
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <CategoryCard
      category={item}
      onPress={() => pushToCategory(item)}
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
      <Ionicons name='folder-outline' size={64} color='#cbd5e1' />
      <Text style={styles.emptyTitle}>Nenhuma categoria encontrada</Text>
    </View>
  );

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['bottom']}>
      <SearchBar
        value={searchText}
        onChangeText={handleSearch}
        placeholder='Buscar categorias...'
      />

      <FlatList
        data={categories}
        renderItem={renderCategory}
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
        ListHeaderComponent={
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsText}>
              {totalCount} categoria{totalCount !== 1 ? 's' : ''} encontrada
              {totalCount !== 1 ? 's' : ''}
            </Text>
            {totalPages > 1 && (
              <Text style={styles.paginationText}>
                Página {currentPage} de {totalPages}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
      />

      <FloatingActionButton route='/categories/create' />
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
