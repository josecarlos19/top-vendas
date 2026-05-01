import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

interface ReportOption {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  route: string;
}

const reportOptions: ReportOption[] = [
  {
    title: 'Vendas por Período',
    description: 'Visualize as vendas em um período específico com totais consolidados',
    icon: 'calendar-outline',
    color: '#3b82f6',
    route: '/(drawer)/reports-stack/sales-by-period',
  },
  {
    title: 'Vendas por Cliente',
    description: 'Analise as vendas de um cliente específico em um período',
    icon: 'person-outline',
    color: '#22c55e',
    route: '/(drawer)/reports-stack/sales-by-customer',
  },
  {
    title: 'Produto Mais Vendido',
    description: 'Gráfico com os produtos mais vendidos por quantidade',
    icon: 'pie-chart-outline',
    color: '#f59e0b',
    route: '/(drawer)/reports-stack/top-products',
  },
  {
    title: 'Categoria Mais Vendida',
    description: 'Gráfico com as categorias mais vendidas por quantidade',
    icon: 'stats-chart-outline',
    color: '#ec4899',
    route: '/(drawer)/reports-stack/top-categories',
  },
];

export default function ReportsIndex() {
  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {reportOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.reportCard}
              onPress={() => router.push(option.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <Ionicons name={option.icon} size={32} color={option.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{option.title}</Text>
                <Text style={styles.cardDescription}>{option.description}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.bottomSpacing} />
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
  cardsContainer: {
    padding: 20,
    gap: 16,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  arrowContainer: {
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20,
  },
});
