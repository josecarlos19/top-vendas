import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReportDatabase } from '@/database/models/Report';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const reportDatabase = useReportDatabase();
  const [isRevenueHidden, setIsRevenueHidden] = useState(false);
  const [chartData, setChartData] = useState<
    Array<{ date: string; totalSales: number }>
  >([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [stats, setStats] = useState([
    {
      title: 'Produtos',
      value: 0,
      icon: 'bag-outline' as keyof typeof Ionicons.glyphMap,
      color: '#3b82f6',
      backgroundColor: '#ffffff',
      route: '/products',
    },
    {
      title: 'Vendas Hoje',
      value: 0,
      icon: 'cart-outline' as keyof typeof Ionicons.glyphMap,
      color: '#22c55e',
      backgroundColor: '#ffffff',
      route: '/sales',
    },
    {
      title: 'Clientes',
      value: 0,
      icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
      color: '#f59e0b',
      backgroundColor: '#ffffff',
      route: '/customers',
    },
    {
      title: 'Receita',
      value: 0,
      icon: 'cash-outline' as keyof typeof Ionicons.glyphMap,
      color: '#ec4899',
      backgroundColor: '#ffffff',
      route: '/reports/sales-by-period',
    },
  ]);

  useEffect(() => {
    loadRevenueVisibility();

    async function fetchReportData() {
      try {
        const reportData = await reportDatabase.index();
        setStats(prevStats => [
          { ...prevStats[0], value: reportData.totalProducts },
          { ...prevStats[1], value: reportData.salesToday },
          { ...prevStats[2], value: reportData.totalCustomers },
          {
            ...prevStats[3],
            value: reportData.revenueToday,
          },
        ]);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
      }
    }

    async function fetchChartData() {
      try {
        setIsLoadingChart(true);
        const salesData = await reportDatabase.getLast7DaysSales();
        setChartData(salesData);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setIsLoadingChart(false);
      }
    }

    fetchReportData();
    fetchChartData();
  }, []);

  const loadRevenueVisibility = async () => {
    try {
      const hidden = await AsyncStorage.getItem('@revenue_hidden');
      setIsRevenueHidden(hidden === 'true');
    } catch (error) {
      console.error('Error loading revenue visibility:', error);
    }
  };

  const toggleRevenueVisibility = async () => {
    try {
      const newState = !isRevenueHidden;
      await AsyncStorage.setItem('@revenue_hidden', String(newState));
      setIsRevenueHidden(newState);
    } catch (error) {
      console.error('Error toggling revenue visibility:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.welcomeSection}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.welcomeTitle}>Bem-vindo de volta! 👋</Text>
            <Text style={styles.welcomeSubtitle}>
              Aqui está um resumo do seu negócio hoje
            </Text>
          </LinearGradient>

          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>📊 Estatísticas</Text>
            <TouchableOpacity
              onPress={toggleRevenueVisibility}
              style={styles.toggleButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isRevenueHidden ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#64748b"
              />
              <Text style={styles.toggleButtonText}>
                {isRevenueHidden ? 'Mostrar' : 'Ocultar'} receita
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                {...stat}
                value={
                  stat.title === 'Receita'
                    ? isRevenueHidden
                      ? '••••••'
                      : `R$ ${Number(stat.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : String(stat.value)
                }
                route={stat.route}
              />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, styles.sectionTitleWithMargin]}>
              📈 Vendas dos Últimos 7 Dias
            </Text>
            {isLoadingChart ? (
              <View style={styles.chartPlaceholder}>
                <ActivityIndicator size='large' color='#667eea' />
                <Text style={styles.chartText}>Carregando dados...</Text>
              </View>
            ) : (
              <BarChart data={chartData} />
            )}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    </View>
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
  welcomeSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 0,
    borderRadius: 16,
    padding: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 8,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionTitleWithMargin: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  activitiesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartPlaceholder: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 12,
  },
  chartSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});
