import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLowStockNotifications, LowStockProduct } from '@/hooks/useLowStockNotifications';
import { router } from 'expo-router';

export default function LowStockNotifications() {
  const { notifications, isLoading, dismissNotification, dismissAll } = useLowStockNotifications();

  const handleViewDetails = (productId: number) => {
    router.push(`/products/${productId}/edit`);
    dismissNotification(productId);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value / 100);
  };

  const getStockStatusColor = (product: LowStockProduct) => {
    if (product.current_stock === 0) return '#ef4444';
    if (product.stockPercentage <= 25) return '#f97316';
    return '#f59e0b';
  };

  const getStockStatusText = (product: LowStockProduct) => {
    if (product.current_stock === 0) return 'ESGOTADO';
    if (product.stockPercentage <= 25) return 'CRÍTICO';
    return 'BAIXO';
  };

  const renderProductItem = (product: LowStockProduct, isCritical: boolean) => (
    <View key={product.id} style={[styles.productItem, isCritical && styles.criticalProductItem]}>
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          {product.category_name && (
            <Text style={styles.categoryText}>📦 {product.category_name}</Text>
          )}
          {product.reference && (
            <Text style={styles.referenceText}>Ref: {product.reference}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => dismissNotification(product.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <View style={styles.stockInfo}>
        <View style={[styles.stockBadge, { backgroundColor: getStockStatusColor(product) + '20' }]}>
          <Text style={[styles.stockBadgeText, { color: getStockStatusColor(product) }]}>
            {getStockStatusText(product)}
          </Text>
        </View>

        <View style={styles.stockDetails}>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Estoque Atual:</Text>
            <Text style={[styles.stockValue, { color: getStockStatusColor(product) }]}>
              {product.current_stock} un.
            </Text>
          </View>
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Estoque Mínimo:</Text>
            <Text style={styles.stockValue}>{product.minimum_stock} un.</Text>
          </View>
          {product.stockDifference < 0 && (
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>Faltam:</Text>
              <Text style={[styles.stockValue, { color: '#ef4444', fontWeight: '600' }]}>
                {Math.abs(product.stockDifference)} un.
              </Text>
            </View>
          )}
        </View>
      </View>

      {product.sale_price && product.stockDifference < 0 && (
        <View style={styles.estimatedCostBox}>
          <Ionicons name="calculator-outline" size={16} color="#64748b" />
          <Text style={styles.estimatedCostLabel}>Custo estimado para reposição: </Text>
          <Text style={styles.estimatedCostValue}>
            {formatCurrency(Math.abs(product.stockDifference) * product.sale_price)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => handleViewDetails(product.id)}
      >
        <Ionicons name="eye-outline" size={16} color="#ffffff" />
        <Text style={styles.viewButtonText}>Ver Produto</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading || !notifications.shouldShow) {
    return null;
  }

  return (
    <Modal
      visible={notifications.shouldShow}
      transparent
      animationType="fade"
      onRequestClose={dismissAll}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="cube-outline" size={24} color="#f97316" />
              <Text style={styles.title}>Alertas de Estoque</Text>
            </View>
            <TouchableOpacity onPress={dismissAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.criticalProducts.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={styles.sectionTitle}>
                    🔴 Críticos ({notifications.criticalProducts.length})
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Produtos esgotados ou com estoque muito baixo (≤25% do mínimo)
                </Text>
                {notifications.criticalProducts.map(product => renderProductItem(product, true))}
              </View>
            )}

            {notifications.lowStockProducts.length > 0 && (
              <View style={[styles.section, notifications.criticalProducts.length > 0 && styles.sectionSpacing]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="warning-outline" size={20} color="#f59e0b" />
                  <Text style={styles.sectionTitle}>
                    🟡 Estoque Baixo ({notifications.lowStockProducts.length})
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Produtos abaixo do estoque mínimo
                </Text>
                {notifications.lowStockProducts.map(product => renderProductItem(product, false))}
              </View>
            )}

            <View style={styles.footer}>
              <Ionicons name="information-circle-outline" size={16} color="#64748b" />
              <Text style={styles.footerText}>
                Estas notificações podem ser dispensadas por 24 horas
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const modalWidth = width > 500 ? 480 : width * 0.92;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: modalWidth,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionDescription: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    marginLeft: 28,
  },
  productItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  criticalProductItem: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  referenceText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  stockInfo: {
    marginBottom: 12,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  stockDetails: {
    gap: 6,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  estimatedCostBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  estimatedCostLabel: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  estimatedCostValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
