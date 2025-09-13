import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
}

export default function ProductItem({
  product,
  onEdit,
  onDelete,
  onToggleActive,
}: ProductItemProps) {
  const formatPrice = (price?: number) => {
    if (!price) return "R$ 0,00";
    return `R$ ${(price / 100).toFixed(2).replace(".", ",")}`;
  };

  const isLowStock = product.current_stock <= product.minimum_stock;
  const isActive = product.active === 1;

  const handleDelete = () => {
    Alert.alert(
      "Confirmar Exclusão",
      `Deseja realmente excluir o produto "${product.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => onDelete(product.id),
        },
      ],
    );
  };

  const handleToggleActive = () => {
    const action = isActive ? "desativar" : "ativar";
    Alert.alert(
      `Confirmar ${action}`,
      `Deseja realmente ${action} o produto "${product.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => onToggleActive(product.id),
        },
      ],
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isActive && styles.inactiveContainer
      ]}
      onPress={() => onEdit(product)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[
            styles.name,
            !isActive && styles.inactiveName
          ]}>
            {product.name}
          </Text>
          {product.category_name && (
            <Text style={styles.category}>{product.category_name}</Text>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={[
            styles.price,
            !isActive && styles.inactivePrice
          ]}>
            {formatPrice(product.sale_price)}
          </Text>
          {product.cost_price && (
            <Text style={styles.costPrice}>
              Custo: {formatPrice(product.cost_price)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.details}>
        {product.barcode && (
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>Código: {product.barcode}</Text>
          </View>
        )}

        {product.reference && (
          <View style={styles.detailRow}>
            <Ionicons name="bookmark-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>Ref: {product.reference}</Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Ionicons
            name="cube-outline"
            size={16}
            color={isLowStock ? "#ef4444" : "#64748b"}
          />
          <Text style={[
            styles.detailText,
            isLowStock && styles.lowStockText
          ]}>
            Estoque: {product.current_stock}
            {product.minimum_stock > 0 && ` (Mín: ${product.minimum_stock})`}
          </Text>
          {isLowStock && (
            <Ionicons name="warning" size={16} color="#ef4444" />
          )}
        </View>

        {product.supplier && (
          <View style={styles.detailRow}>
            <Ionicons name="business-outline" size={16} color="#64748b" />
            <Text style={styles.detailText}>Fornecedor: {product.supplier}</Text>
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

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(product)}
        >
          <Ionicons name="pencil-outline" size={16} color="#3b82f6" />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isActive ? styles.deactivateButton : styles.activateButton
          ]}
          onPress={handleToggleActive}
        >
          <Ionicons
            name={isActive ? "pause-outline" : "play-outline"}
            size={16}
            color={isActive ? "#f59e0b" : "#22c55e"}
          />
          <Text style={[
            styles.toggleButtonText,
            isActive ? styles.deactivateButtonText : styles.activateButtonText
          ]}>
            {isActive ? "Desativar" : "Ativar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={16} color="#ef4444" />
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>

      {isLowStock && isActive && (
        <View style={styles.lowStockBanner}>
          <Ionicons name="warning" size={16} color="#dc2626" />
          <Text style={styles.lowStockBannerText}>Estoque baixo!</Text>
        </View>
      )}

      {!isActive && (
        <View style={styles.inactiveLabel}>
          <Text style={styles.inactiveLabelText}>Inativo</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inactiveContainer: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
    opacity: 0.7,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  inactiveName: {
    color: "#64748b",
  },
  category: {
    fontSize: 12,
    color: "#FF6B35",
    fontWeight: "500",
    backgroundColor: "#fff5f0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 2,
  },
  inactivePrice: {
    color: "#64748b",
  },
  costPrice: {
    fontSize: 12,
    color: "#64748b",
  },
  details: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#475569",
    flex: 1,
  },
  lowStockText: {
    color: "#ef4444",
    fontWeight: "500",
  },
  descriptionContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#64748b",
  },
  description: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  editButton: {
    backgroundColor: "#eff6ff",
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3b82f6",
  },
  activateButton: {
    backgroundColor: "#f0fdf4",
  },
  deactivateButton: {
    backgroundColor: "#fffbeb",
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  activateButtonText: {
    color: "#22c55e",
  },
  deactivateButtonText: {
    color: "#f59e0b",
  },
  deleteButton: {
    backgroundColor: "#fef2f2",
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ef4444",
  },
  lowStockBanner: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fecaca",
    gap: 4,
  },
  lowStockBannerText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#dc2626",
  },
  inactiveLabel: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  inactiveLabelText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
  },
});
