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
import { router } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { useSaleDatabase } from '@/database/models/Sale';
import { SafeAreaView } from 'react-native-safe-area-context';
import PeriodFilter from '@/components/PeriodFilter';

interface ProductSale {
  product_id: number;
  product_name: string;
  quantity: number;
  percentage: number;
  color: string;
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function TopProducts() {
  const [productSales, setProductSales] = useState<ProductSale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primeiro dia do mês atual
    return date;
  });
  const [endDate, setEndDate] = useState(new Date());

  const saleDatabase = useSaleDatabase();

  const loadProductSales = async () => {
    try {
      setIsLoading(true);

      // Buscar todas as vendas
      const allSales = await saleDatabase.index();

      // Filtrar vendas por período e excluir canceladas
      const filteredSales = allSales.filter((sale) => {
        // Verificar se sale_date existe
        if (!sale.sale_date) {
          return false;
        }

        const saleDate = new Date(sale.sale_date);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Normalizar para comparar apenas datas (sem hora)
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        saleDate.setHours(0, 0, 0, 0);

        return (
          saleDate >= start &&
          saleDate <= end &&
          sale.status !== 'cancelled'
        );
      });

      // Agrupar produtos por ID e somar quantidades
      const productMap = new Map<number, { name: string; quantity: number }>();

      filteredSales.forEach((sale) => {
        if (sale.items && sale.items.length > 0) {
          sale.items.forEach((item: any) => {
            const productId = item.product_id;
            const productName = item.product_name || 'Produto sem nome';
            const quantity = item.quantity || 0;

            if (productMap.has(productId)) {
              const existing = productMap.get(productId)!;
              existing.quantity += quantity;
            } else {
              productMap.set(productId, {
                name: productName,
                quantity,
              });
            }
          });
        }
      });

      // Converter para array e ordenar por quantidade
      const productsArray = Array.from(productMap.entries()).map(
        ([id, data]) => ({
          product_id: id,
          product_name: data.name,
          quantity: data.quantity,
        })
      );

      productsArray.sort((a, b) => b.quantity - a.quantity);

      // Pegar apenas os 5 primeiros
      const top5Products = productsArray.slice(0, 5);

      // Calcular total e percentuais
      const totalQuantity = top5Products.reduce(
        (sum, product) => sum + product.quantity,
        0
      );

      const productsWithPercentage: ProductSale[] = top5Products.map(
        (product, index) => ({
          ...product,
          percentage:
            totalQuantity > 0
              ? (product.quantity / totalQuantity) * 100
              : 0,
          color: COLORS[index % COLORS.length],
        })
      );

      setProductSales(productsWithPercentage);
    } catch (error) {
      console.error('Erro ao carregar vendas de produtos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pieData = productSales.map((product) => ({
    value: product.quantity,
    text: `${product.quantity}`,
    color: product.color,
    label: product.product_name,
  }));

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bar-chart-outline" size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nenhum dado encontrado</Text>
      <Text style={styles.emptySubtitle}>
        Não há vendas de produtos no período selecionado.{'\n'}
        Tente ajustar o período ou realizar vendas.
      </Text>
    </View>
  );

  const renderLegend = () => (
    <View style={styles.legendContainer}>
      <Text style={styles.legendTitle}>Legenda</Text>
      {productSales.map((product) => (
        <View key={product.product_id} style={styles.legendItem}>
          <View
            style={[styles.legendColor, { backgroundColor: product.color }]}
          />
          <View style={styles.legendInfo}>
            <Text style={styles.legendProductName} numberOfLines={1}>
              {product.product_name}
            </Text>
            <Text style={styles.legendDetails}>
              {product.quantity} unidades • {product.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Filtros */}
        <View style={styles.filterSection}>
          <PeriodFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={loadProductSales}
          >
            <Ionicons name="search" size={20} color="#ffffff" />
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico e Legenda */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        ) : productSales.length > 0 ? (
          <View style={styles.resultsContainer}>
            {/* Gráfico */}
            <View style={styles.chartContainer}>
              <PieChart
                data={pieData}
                radius={120}
                innerRadius={60}
                centerLabelComponent={() => (
                  <View style={styles.centerLabel}>
                    <Text style={styles.centerLabelTitle}>Total</Text>
                    <Text style={styles.centerLabelValue}>
                      {productSales.reduce(
                        (sum, product) => sum + product.quantity,
                        0
                      )}
                    </Text>
                    <Text style={styles.centerLabelSubtitle}>unidades</Text>
                  </View>
                )}
                donut
                showText
                textColor="#fff"
                textSize={14}
                fontWeight="bold"
              />
            </View>

            {/* Legenda */}
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
  legendProductName: {
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
