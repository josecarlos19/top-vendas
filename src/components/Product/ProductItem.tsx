import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface Product {
  id: number;
  name: string;
  barcode?: string;
  reference?: string;
  description?: string;
  cost_price?: number;
  sale_price: number;
  wholesale_price?: number;
  initial_stock: number;
  current_stock: number;
  minimum_stock: number;
  category_id?: number;
  category_name?: string;
  supplier?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

interface ProductItemProps {
  product: Product;
  onEdit: (product: Product) => void;
}

export default function ProductItem({ product, onEdit }: ProductItemProps) {
  const formatPrice = (price?: number) => {
    if (!price) return 'R$ 0,00';
    return `R$ ${(price / 100).toFixed(2).replace('.', ',')}`;
  };

  const isLowStock = product.current_stock <= product.minimum_stock;
  const isActive = product.active === 1;

  return (
    <TouchableOpacity
      style={[styles.container, !isActive && styles.inactiveContainer]}
      onPress={() => onEdit(product)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.name, !isActive && styles.inactiveName]}>
            {product.name}
          </Text>
          {product.category_name && (
            <Text style={styles.category}>{product.category_name}</Text>
          )}
        </View>

        <View style={styles.priceContainer}>
          {!isActive && (
            <View style={styles.inactiveLabel}>
              <Text style={styles.inactiveLabelText}>Inativo</Text>
            </View>
          )}

          <Text
            style={[
              styles.price,
              !isActive && styles.inactivePrice,
              { marginLeft: 'auto' },
            ]}
          >
            {formatPrice(product.sale_price)}
          </Text>
        </View>
      </View>

      <View style={styles.details}>
        {product.barcode && (
          <View style={styles.detailRow}>
            <Ionicons name='barcode-outline' size={16} color='#64748b' />
            <Text style={styles.detailText}>Código: {product.barcode}</Text>
          </View>
        )}

        {product.reference && (
          <View style={styles.detailRow}>
            <Ionicons name='bookmark-outline' size={16} color='#64748b' />
            <Text style={styles.detailText}>Ref: {product.reference}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons
            name='cube-outline'
            size={16}
            color={isLowStock ? '#ef4444' : '#64748b'}
          />
          <Text style={[styles.detailText, isLowStock && styles.lowStockText]}>
            Estoque: {product.current_stock}
            {product.minimum_stock > 0 && ` (Mín: ${product.minimum_stock})`}
          </Text>
          {isLowStock && (
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Ionicons name='warning' size={16} color='#ef4444' />
              <Text style={styles.lowStockBannerText}>Estoque baixo!</Text>
            </View>
          )}
        </View>

        {product.supplier && (
          <View style={styles.detailRow}>
            <Ionicons name='business-outline' size={16} color='#64748b' />
            <Text style={styles.detailText}>
              Fornecedor: {product.supplier}
            </Text>
          </View>
        )}
      </View>

      {product.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveContainer: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  inactiveName: {
    color: '#64748b',
  },
  category: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
    backgroundColor: '#fff5f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priceContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  inactivePrice: {
    color: '#64748b',
  },
  costPrice: {
    fontSize: 12,
    color: '#64748b',
  },
  details: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#475569',
  },
  lowStockText: {
    color: '#ef4444',
    fontWeight: '700',
  },
  descriptionContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#64748b',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#eff6ff',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  activateButton: {
    backgroundColor: '#f0fdf4',
  },
  deactivateButton: {
    backgroundColor: '#fffbeb',
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activateButtonText: {
    color: '#22c55e',
  },
  deactivateButtonText: {
    color: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
  lowStockBanner: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
    gap: 4,
  },
  lowStockBannerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
  },
  inactiveLabel: {
    backgroundColor: '#f59e0b',
    padding: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  inactiveLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
});
