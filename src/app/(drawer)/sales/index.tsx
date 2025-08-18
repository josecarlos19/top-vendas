import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSaleDatabase } from "@/database/models/Sale";
import { SaleSearchInterface } from "@/interfaces/models/saleInterface";
import formatCurrency from "@/components/utils/formatCurrency";

interface Sale {
  id: number;
  customer_id?: number;
  customer_name?: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  installments: number;
  status: string;
  sale_date: string;
  notes?: string;
  items?: any[];
  created_at: string;
  updated_at: string;
}

const PAYMENT_METHOD_LABELS: { [key: string]: string } = {
  money: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  transfer: 'Transferência',
  installment: 'Parcelado',
};

const STATUS_LABELS: { [key: string]: string } = {
  pending: 'Pendente',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export default function SalesList() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const perPage = 10;
  const saleDatabase = useSaleDatabase();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText !== undefined) {
        setCurrentPage(1);
        setHasMoreData(true);
        loadSales(1, false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const loadSales = async (page: number = 1, append: boolean = true) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const searchParams: SaleSearchInterface = {
        page,
        perPage,
      };

      if (searchText.trim()) {
        searchParams.q = searchText.trim();
      }

      const [data, count] = await Promise.all([
        saleDatabase.index(searchParams),
        saleDatabase.count({
          q: searchParams.q,
        })
      ]);

      if (append && page > 1) {
        setSales(prev => [
          ...prev,
          ...data.map((item: any) => ({
            id: item.id,
            customer_id: item.customer_id || undefined,
            customer_name: item.customer_name || undefined,
            subtotal: item.subtotal,
            discount: item.discount || 0,
            total: item.total_amount,
            payment_method: item.payment_method,
            installments: item.installments || 1,
            status: item.status,
            sale_date: item.sale_date,
            notes: item.notes || undefined,
            items: item.items || [],
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        ]);
      } else {
        setSales(
          data.map((item: any) => ({
            id: item.id,
            customer_id: item.customer_id || undefined,
            customer_name: item.customer_name || undefined,
            subtotal: item.subtotal,
            discount: item.discount || 0,
            total: item.total_amount,
            payment_method: item.payment_method,
            installments: item.installments || 1,
            status: item.status,
            sale_date: item.sale_date,
            notes: item.notes || undefined,
            items: item.items || [],
            created_at: item.created_at,
            updated_at: item.updated_at,
          }))
        );
      }

      setTotalCount(count);
      setCurrentPage(page);

      const totalPages = Math.ceil(count / perPage);
      setHasMoreData(page < totalPages);

    } catch (error) {
      console.error("Error loading sales:", error);
      Alert.alert("Erro", "Falha ao carregar vendas");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
  };

  const loadMore = () => {
    if (hasMoreData && !isLoadingMore && !isLoading) {
      loadSales(currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMoreData(true);
    loadSales(1, false);
  };

  const handleEdit = (sale: Sale) => {
    router.push(`/sales/${sale.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    const sale = sales.find(s => s.id === id);
    const saleIdentifier = sale?.customer_name
      ? `venda de ${sale.customer_name}`
      : `venda #${id}`;

    Alert.alert(
      "Confirmar exclusão",
      `Tem certeza que deseja excluir a ${saleIdentifier}? Esta ação não pode ser desfeita e o estoque será revertido.`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await saleDatabase.remove(id);
              setSales(prev => prev.filter(s => s.id !== id));
              setTotalCount(prev => prev - 1);

              Alert.alert("Sucesso", "Venda excluída com sucesso!");
            } catch (error) {
              console.error("Error deleting sale:", error);
              loadSales(1, false);
              Alert.alert("Erro", "Falha ao excluir venda. Tente novamente.");
            }
          }
        }
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadSales(1, false);
    }, [])
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#dcfce7';
      case 'pending':
        return '#fef3c7';
      case 'cancelled':
        return '#fecaca';
      default:
        return '#f1f5f9';
    }
  };

  const renderSale = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => handleEdit(item)}
      activeOpacity={0.7}
    >
      <View style={styles.saleHeader}>
        <View style={styles.saleHeaderLeft}>
          <Text style={styles.saleId}>#{item.id}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusBackgroundColor(item.status) }
          ]}>
            <Text style={[
              styles.statusText,
              { color: getStatusColor(item.status) }
            ]}>
              {STATUS_LABELS[item.status] || item.status}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            Alert.alert(
              "Ações",
              "Escolha uma ação:",
              [
                { text: "Cancelar", style: "cancel" },
                { text: "Editar", onPress: () => handleEdit(item) },
                { text: "Excluir", style: "destructive", onPress: () => handleDelete(item.id) },
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={16} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.saleContent}>
        {item.customer_name && (
          <View style={styles.customerInfo}>
            <Ionicons name="person-outline" size={16} color="#64748b" />
            <Text style={styles.customerName}>{item.customer_name}</Text>
          </View>
        )}

        <View style={styles.saleDetails}>
          <View style={styles.saleDetailRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.saleDetailText}>
              {formatDate(item.sale_date)}
            </Text>
          </View>

          <View style={styles.saleDetailRow}>
            <Ionicons name="card-outline" size={16} color="#64748b" />
            <Text style={styles.saleDetailText}>
              {PAYMENT_METHOD_LABELS[item.payment_method] || item.payment_method}
              {item.installments > 1 && ` (${item.installments}x)`}
            </Text>
          </View>

          <View style={styles.saleDetailRow}>
            <Ionicons name="cube-outline" size={16} color="#64748b" />
            <Text style={styles.saleDetailText}>
              {item.items?.length || 0} item{(item.items?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.saleFooter}>
          {item.discount > 0 && (
            <View style={styles.discountInfo}>
              <Text style={styles.originalTotal}>
                {formatCurrency((item.subtotal).toString())}
              </Text>
              <Text style={styles.discountAmount}>
                -{formatCurrency((item.discount).toString())}
              </Text>
            </View>
          )}
          <Text style={styles.totalAmount}>
            {formatCurrency((item.total).toString())}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#FF6B35" />
        <Text style={styles.loadingText}>Carregando mais...</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nenhuma venda encontrada</Text>
      <Text style={styles.emptySubtitle}>
        {searchText
          ? "Tente ajustar os termos de busca ou limpar o filtro"
          : "Comece registrando sua primeira venda"
        }
      </Text>
      {!searchText && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={() => router.push("/sales/create")}
        >
          <Ionicons name="add-outline" size={16} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.createFirstButtonText}>Registrar primeira venda</Text>
        </TouchableOpacity>
      )}
      {searchText && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => handleSearch("")}
        >
          <Ionicons name="refresh-outline" size={16} color="#FF6B35" style={styles.buttonIcon} />
          <Text style={styles.clearSearchButtonText}>Limpar busca</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vendas</Text>
          <Text style={styles.headerSubtitle}>Gerencie suas vendas</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#64748b"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por cliente, observações..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#94a3b8"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {totalCount} venda{totalCount !== 1 ? "s" : ""} encontrada{totalCount !== 1 ? "s" : ""}
          {searchText && (
            <Text style={styles.searchIndicator}> para "{searchText}"</Text>
          )}
        </Text>
        {totalPages > 1 && (
          <Text style={styles.paginationText}>
            Página {currentPage} de {totalPages}
          </Text>
        )}
      </View>

      <FlatList
        data={sales}
        renderItem={renderSale}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContainer,
          sales.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={["#FF6B35"]}
            tintColor="#FF6B35"
          />
        }
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
      />
      {isLoading && sales.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingOverlayText}>Carregando vendas...</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/sales/create")}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  resultsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  searchIndicator: {
    fontWeight: "400",
    fontStyle: "italic",
  },
  paginationText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  saleCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  saleHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  saleId: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  moreButton: {
    padding: 8,
  },
  saleContent: {
    gap: 12,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  saleDetails: {
    gap: 8,
  },
  saleDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saleDetailText: {
    fontSize: 14,
    color: "#64748b",
  },
  saleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  discountInfo: {
    alignItems: "flex-end",
  },
  originalTotal: {
    fontSize: 14,
    color: "#64748b",
    textDecorationLine: "line-through",
  },
  discountAmount: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FF6B35",
  },
  loadingFooter: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(248, 250, 252, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#FF6B35",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  createFirstButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  clearSearchButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF6B35",
    marginTop: 12,
  },
  clearSearchButtonText: {
    color: "#FF6B35",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
