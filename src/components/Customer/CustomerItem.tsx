import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface Customer {
  id: number;
  name: string;
  document: string;
  document_type: string;
  phone?: string;
  mobile?: string;
  email: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

interface CustomerItemProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number) => void;
}

export default function CustomerItem({
  customer,
  onEdit,
  onDelete,
  onToggleActive,
}: CustomerItemProps) {
  const formatDocument = (document: string, type: string) => {
    if (!document) return "";

    if (type === "CPF" && document.length === 11) {
      return document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    if (type === "CNPJ" && document.length === 14) {
      return document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }

    return document;
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return "";

    if (phone.length === 11) {
      return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }

    if (phone.length === 10) {
      return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }

    return phone;
  };

  const getDisplayPhone = () => {
    if (customer.mobile) {
      return formatPhone(customer.mobile);
    }
    if (customer.phone) {
      return formatPhone(customer.phone);
    }
    return "Não informado";
  };

  const getLocationText = () => {
    const parts = [];
    if (customer.city) parts.push(customer.city);
    if (customer.state) parts.push(customer.state);
    return parts.length > 0 ? parts.join(", ") : "Não informado";
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !customer.active && styles.inactiveContainer
      ]}
      onPress={() => onEdit(customer)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <View style={[
            styles.avatar,
            !customer.active && styles.inactiveAvatar
          ]}>
            <Text style={[
              styles.avatarText,
              !customer.active && styles.inactiveAvatarText
            ]}>
              {customer.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.nameInfo}>
            <Text style={[
              styles.name,
              !customer.active && styles.inactiveName
            ]}>
              {customer.name}
            </Text>
            <Text style={styles.document}>
              {customer.document_type}: {formatDocument(customer.document, customer.document_type)}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(customer)}
          >
            <Ionicons name="pencil" size={16} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(customer.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{customer.email}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{getDisplayPhone()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text style={styles.detailText}>{getLocationText()}</Text>
        </View>
      </View>

      {customer.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notes} numberOfLines={2}>
            {customer.notes}
          </Text>
        </View>
      )}

      {!customer.active && (
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
  nameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inactiveAvatar: {
    backgroundColor: "#94a3b8",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  inactiveAvatarText: {
    color: "#f1f5f9",
  },
  nameInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  inactiveName: {
    color: "#64748b",
  },
  document: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeButton: {
    backgroundColor: "#dcfce7",
  },
  inactiveButton: {
    backgroundColor: "#fef3c7",
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  details: {
    gap: 8,
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
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B35",
  },
  notes: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
    lineHeight: 18,
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
