import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReportDatabase } from '@/database/models/Report';
import { PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import PeriodFilter from '@/components/PeriodFilter';

interface CategorySale {
  category_id: number | null;
  category_name: string;
  quantity: number;
  percentage: number;
  color: string;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function TopCategories() {
  const [categorySales, setCategorySales] = useState<CategorySale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const reportDatabase = useReportDatabase();

  const loadCategorySales = async () => {
    try {
      setIsLoading(true);
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const result = await reportDatabase.getTopCategories(
        startDateStr,
        endDateStr,
        5
      );

      const totalQuantity = result.reduce(
        (sum, category) => sum + category.quantity,
        0
      );

      const categoriesWithPercentage: CategorySale[] = result.map(
        (category, index) => ({
          category_id: category.category_id === 0 ? null : category.category_id,
          category_name: category.category_name,
          quantity: category.quantity,
          percentage:
            totalQuantity > 0
              ? (category.quantity / totalQuantity) * 100
              : 0,
          color: COLORS[index % COLORS.length],
        })
      );

      setCategorySales(categoriesWithPercentage);
    } catch (error) {
      console.error('Error loading category sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pieData = categorySales.map((category) => ({
    value: category.quantity,
    text: `${category.quantity}`,
    color: category.color,
    label: category.category_name,
  }));

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="pie-chart-outline" size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nenhum dado encontrado</Text>
      <Text style={styles.emptySubtitle}>
        Não há vendas de categorias no período selecionado.{'\n'}
        Tente ajustar o período ou realizar vendas.
      </Text>
    </View>
  );

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Legenda</Text>
      {categorySales.map((category, index) => (
        <View key={`${category.category_id}-${index}`} style={styles.legendItem}>
          <View
            style={[styles.legendColor, { backgroundColor: category.color }]}
          />
          <View style={styles.legendInfo}>
            <Text style={styles.legendCategoryName} numberOfLines={1}>
              {category.category_name}
            </Text>
            <Text style={styles.legendDetails}>
              {category.quantity} {category.quantity === 1 ? 'item' : 'itens'} • {category.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.filterSection}>
          <PeriodFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={loadCategorySales}
          >
            <Ionicons name="search" size={20} color="#ffffff" />
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        ) : categorySales.length > 0 ? (
          <View style={styles.resultsContainer}>
            <View style={styles.chartContainer}>
              <PieChart
                data={pieData}
                radius={120}
                innerRadius={60}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelTitle}>Total</Text>
                    <Text style={styles.centerLabelValue}>
                      {categorySales.reduce(
                        (sum, category) => sum + category.quantity,
                        0
                      )}
                    </Text>
                    <Text style={styles.centerLabelSubtitle}>itens</Text>
                  </View>
                )}
                donut
                showText
                textColor="#fff"
                textSize={14}
                fontWeight="bold"
              />
            </View>

            {renderLegend()}
          </View>
        ) : (
          renderEmpty()
        )}
      </ScrollView>
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
  searchButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  centerLabelValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 4,
  },
  centerLabelSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  legendContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    gap: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendInfo: {
    flex: 1,
  },
  legendCategoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  legendDetails: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#475569',
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
