import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import StatCard from "@/components/StatCard";
import QuickAction from "@/components/QuickActions";
import ActivityItem from "@/components/ActivityItem";

export default function Dashboard() {
  const stats = [
    {
      title: "Produtos",
      value: "127",
      icon: "cube-outline" as keyof typeof Ionicons.glyphMap,
      color: "#3b82f6",
      backgroundColor: "#ffffff",
    },
    {
      title: "Vendas Hoje",
      value: "43",
      icon: "trending-up-outline" as keyof typeof Ionicons.glyphMap,
      color: "#22c55e",
      backgroundColor: "#ffffff",
    },
    {
      title: "Clientes",
      value: "89",
      icon: "people-outline" as keyof typeof Ionicons.glyphMap,
      color: "#f59e0b",
      backgroundColor: "#ffffff",
    },
    {
      title: "Receita",
      value: "R$ 2.4k",
      icon: "cash-outline" as keyof typeof Ionicons.glyphMap,
      color: "#ec4899",
      backgroundColor: "#ffffff",
    },
  ];

  const quickActions = [
    {
      title: "Nova Venda",
      icon: "card-outline" as keyof typeof Ionicons.glyphMap,
      color: "#667eea",
      route: "/sales/create",
    },
    {
      title: "Novo Produto",
      icon: "add-circle-outline" as keyof typeof Ionicons.glyphMap,
      color: "#06b6d4",
      route: "/products/create",
    },
    {
      title: "Novo Cliente",
      icon: "person-add-outline" as keyof typeof Ionicons.glyphMap,
      color: "#10b981",
      route: "/customers/create",
    },
    {
      title: "Relatórios",
      icon: "analytics-outline" as keyof typeof Ionicons.glyphMap,
      color: "#f59e0b",
      route: "/(drawer)/reports",
    },
  ];

  const recentActivities = [
    {
      title: "Venda #1234 finalizada",
      time: "há 5 minutos",
      icon: "checkmark-circle-outline" as keyof typeof Ionicons.glyphMap,
      iconColor: "#22c55e",
      iconBg: "#dcfce7",
    },
    {
      title: "Novo cliente cadastrado",
      time: "há 12 minutos",
      icon: "person-add-outline" as keyof typeof Ionicons.glyphMap,
      iconColor: "#3b82f6",
      iconBg: "#dbeafe",
    },
    {
      title: "Estoque atualizado",
      time: "há 1 hora",
      icon: "refresh-outline" as keyof typeof Ionicons.glyphMap,
      iconColor: "#f59e0b",
      iconBg: "#fef3c7",
    },
    {
      title: "Backup realizado",
      time: "há 2 horas",
      icon: "cloud-done-outline" as keyof typeof Ionicons.glyphMap,
      iconColor: "#8b5cf6",
      iconBg: "#ede9fe",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
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
            <StatCard key={index} {...stat} />
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
          <Text style={styles.sectionTitle}>📋 Atividades Recentes</Text>
          <View style={styles.activitiesCard}>
            {recentActivities.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 Vendas dos Últimos 7 Dias</Text>
          <View style={styles.chartPlaceholder}>
            <Ionicons name="analytics-outline" size={48} color="#94a3b8" />
            <Text style={styles.chartText}>Gráfico de vendas</Text>
            <Text style={styles.chartSubtext}>Em breve</Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 16,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  activitiesCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartPlaceholder: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  chartText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748b",
    marginTop: 12,
  },
  chartSubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});
