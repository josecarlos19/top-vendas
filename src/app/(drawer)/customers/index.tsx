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
import { useCustomerDatabase } from "@/database/models/Customer";
import { CustomerSearchInterface } from "@/interfaces/models/customerInterface";
import CustomerItem, { Customer } from "@/components/Customer/CustomerItem";

export default function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const perPage = 10;
  const customerDatabase = useCustomerDatabase();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText !== undefined) {
        setCurrentPage(1);
        setHasMoreData(true);
        loadCustomers(1, false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const loadCustomers = async (page: number = 1, append: boolean = true) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const searchParams: CustomerSearchInterface = {
        page,
        perPage,
      };

      if (searchText.trim()) {
        searchParams.q = searchText.trim();
      }

      const [data, count] = await Promise.all([
        customerDatabase.index(searchParams),
        customerDatabase.count({
          q: searchParams.q,
        })
      ]);

      if (append && page > 1) {
        setCustomers(prev => [
          ...prev,
          ...data.map((item: any) => ({
            id: item.id,
            name: item.name,
            document: item.document,
            document_type: item.document_type,
            phone: item.phone,
            mobile: item.mobile,
            email: item.email,
            address: item.address,
            neighborhood: item.neighborhood,
            city: item.city,
            state: item.state,
            zip_code: item.zip_code,
            notes: item.notes,
            active: item.active,
            created_at: item.created_at,
            updated_at: item.updated_at,
          })),
        ]);
      } else {
        setCustomers(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            document: item.document,
            document_type: item.document_type,
            phone: item.phone,
            mobile: item.mobile,
            email: item.email,
            address: item.address,
            neighborhood: item.neighborhood,
            city: item.city,
            state: item.state,
            zip_code: item.zip_code,
            notes: item.notes,
            active: item.active,
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
      console.error("Error loading customers:", error);
      Alert.alert("Erro", "Falha ao carregar clientes");
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
      loadCustomers(currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMoreData(true);
    loadCustomers(1, false);
  };

  const handleEdit = (customer: Customer) => {
    router.push(`/(drawer)/customers/${customer.id}` as any);
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Confirmar exclusão",
      "Tem certeza que deseja excluir este cliente?",
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
              await customerDatabase.remove(id);
              await loadCustomers(1, false);
              Alert.alert("Sucesso", "Cliente excluído com sucesso!");
            } catch (error) {
              console.error("Error deleting customer:", error);
              Alert.alert("Erro", "Falha ao excluir cliente");
            }
          }
        }
      ]
    );
  };

  const handleToggleActive = async (id: number) => {
    try {
      await customerDatabase.toggleActive(id);
      await loadCustomers(currentPage, false);
    } catch (error) {
      console.error("Error toggling customer status:", error);
      Alert.alert("Erro", "Falha ao alterar status do cliente");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCustomers(1, false);
    }, [])
  );

  const renderCustomer = ({ item }: { item: Customer }) => (
    <CustomerItem
      customer={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onToggleActive={handleToggleActive}
    />
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
      <Ionicons name="people-outline" size={64} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>Nenhum cliente encontrado</Text>
      <Text style={styles.emptySubtitle}>
        {searchText ? "Tente ajustar os termos de busca" : "Comece cadastrando seu primeiro cliente"}
      </Text>
      {!searchText && (
        <TouchableOpacity
          style={styles.createFirstButton}
          onPress={() => router.push("/(drawer)/customers/create")}
        >
          <Text style={styles.createFirstButtonText}>Cadastrar primeiro cliente</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <View style={styles.container}>
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
            placeholder="Buscar por nome, email, documento..."
            value={searchText}
            onChangeText={handleSearch}
            placeholderTextColor="#94a3b8"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {totalCount} cliente{totalCount !== 1 ? "s" : ""} encontrado{totalCount !== 1 ? "s" : ""}
        </Text>
        {totalPages > 1 && (
          <Text style={styles.paginationText}>
            Página {currentPage} de {totalPages}
          </Text>
        )}
      </View>

      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
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

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(drawer)/customers/create")}
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
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
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
  resultsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultsText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  paginationText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#475569",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },
  createFirstButton: {
    backgroundColor: "#FF6B35",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  createFirstButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
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
