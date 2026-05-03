import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import formatCurrency from '@/components/utils/formatCurrency';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    sale_price: number;
    current_stock?: number;
    barcode?: string;
    category_name?: string;
    active?: number;
    [key: string]: any;
  };
  onPress?: (product: ProductCardProps['product']) => void;
  onStockAdjust?: (product: ProductCardProps['product']) => void;
  showStockAction?: boolean;
}

const getStockColor = (stock?: number) => {
  if (stock === undefined || stock === null) return '#94a3b8';
  if (stock > 10) return '#22c55e';
  if (stock >= 1) return '#f59e0b';
  return '#ef4444';
};

const getStockBackgroundColor = (stock?: number) => {
  if (stock === undefined || stock === null) return '#f1f5f9';
  if (stock > 10) return '#dcfce7';
  if (stock >= 1) return '#fef3c7';
  return '#fee2e2';
};

export default function ProductCard({ product, onPress, onStockAdjust, showStockAction = false }: ProductCardProps) {
  const handlePress = () => {
    onPress?.(product);
  };

  const handleStockAdjust = (e: any) => {
    e.stopPropagation();
    onStockAdjust?.(product);
  };

  const isInactive = product.active === 0;

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.productHeader}>
        <View style={styles.productHeaderLeft}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
        </View>
        {isInactive && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveText}>Inativo</Text>
          </View>
        )}
      </View>

      <View style={styles.productContent}>
        <View style={styles.priceSection}>
          <Ionicons name="cash-outline" size={14} color="#8b5cf6" />
          <Text style={styles.priceAmount}>
            {formatCurrency(product.sale_price.toString())}
          </Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="cube" size={12} color="#64748b" />
            <View
              style={[
                styles.stockBadge,
                {
                  backgroundColor: getStockBackgroundColor(
                    product.current_stock
                  ),
                },
              ]}
            >
              <Text
                style={[
                  styles.stockText,
                  { color: getStockColor(product.current_stock) },
                ]}
              >
                Estoque: {product.current_stock ?? 'N/A'}
              </Text>
            </View>
          </View>

          {showStockAction && onStockAdjust && (
            <TouchableOpacity
              style={styles.stockActionButton}
              onPress={handleStockAdjust}
              activeOpacity={0.7}
            >
              <Ionicons name="enter-outline" size={14} color="#3b82f6" />
            </TouchableOpacity>
          )}
        </View>

        {(product.category_name || product.barcode) && (
          <View style={styles.metadataRow}>
            {product.category_name && (
              <View style={styles.metadataItem}>
                <Ionicons name="albums" size={10} color="#94a3b8" />
                <Text style={styles.metadataText} numberOfLines={1}>
                  {product.category_name}
                </Text>
              </View>
            )}
            {product.barcode && (
              <View style={styles.metadataItem}>
                <Ionicons name="barcode" size={10} color="#94a3b8" />
                <Text style={styles.metadataText} numberOfLines={1}>
                  {product.barcode}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  productHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ef4444',
  },
  productContent: {
    gap: 5,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stockActionButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 0,
  },
  metadataText: {
    fontSize: 10,
    color: '#94a3b8',
  },
});
