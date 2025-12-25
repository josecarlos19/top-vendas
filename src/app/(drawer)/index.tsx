import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import StatCard from '@/components/StatCard';
import QuickAction from '@/components/QuickActions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReportDatabase } from '@/database/models/Report';

export default function Index() {
  const reportDatabase = useReportDatabase();
  const [stats, setStats] = useState([
    {
      title: 'Produtos',
      value: 0,
      icon: 'cube-outline' as keyof typeof Ionicons.glyphMap,
      color: '#3b82f6',
      backgroundColor: '#ffffff',
      route: '/products',
    },
    {
      title: 'Vendas Hoje',
      value: 0,
      icon: 'trending-up-outline' as keyof typeof Ionicons.glyphMap,
      color: '#22c55e',
      backgroundColor: '#ffffff',
      route: '/reports/daily-sales',
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
      route: '/reports/revenue',
    },
  ]);

  const quickActions = [
    {
      title: 'Nova Venda',
      icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
      color: '#667eea',
      route: '/sales/create',
    },
    {
      title: 'Novo Produto',
      icon: 'add-circle-outline' as keyof typeof Ionicons.glyphMap,
      color: '#06b6d4',
      route: '/products/create',
    },
    {
      title: 'Novo Cliente',
      icon: 'person-add-outline' as keyof typeof Ionicons.glyphMap,
      color: '#10b981',
      route: '/customers/create',
    },
    {
      title: 'Relatórios',
      icon: 'analytics-outline' as keyof typeof Ionicons.glyphMap,
      color: '#f59e0b',
      route: '/(drawer)/reports',
    },
  ];

  useEffect(() => {
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

    fetchReportData();
  }, []);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
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

          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                {...stat}
                value={
                  stat.title === 'Receita'
                    ? `R$ ${Number(stat.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : String(stat.value)
                }
              />
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action, index) => (
                <QuickAction key={index} {...action} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📈 Vendas dos Últimos 7 Dias
            </Text>
            <View style={styles.chartPlaceholder}>
              <Ionicons name='analytics-outline' size={48} color='#94a3b8' />
              <Text style={styles.chartText}>Gráfico de vendas</Text>
              <Text style={styles.chartSubtext}>Em breve</Text>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
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
  welcomeSection: {
    margin: 20,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
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
