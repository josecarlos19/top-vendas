import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProductDatabase } from "@/database/models/Product";
import { useCategoryDatabase } from "@/database/models/Category";
import { Input } from "@/components/Input";
import formatCurrency from "@/components/utils/formatCurrency";

interface Category {
  id: number;
  name: string;
}

export default function CreateProduct() {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [minimumStock, setMinimumStock] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [supplier, setSupplier] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const productDatabase = useProductDatabase();
  const categoryDatabase = useCategoryDatabase();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await categoryDatabase.index();
      setCategories(categoriesData.map(cat => ({
        id: cat.id!,
        name: cat.name!
      })));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };


  const formatNumber = (text: string) => {
    return text.replace(/\D/g, '');
  };

  const getCurrencyValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue
      .replace(/[R$\s.]/g, '')
      .replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Erro", "Por favor, preencha o nome do produto.");
      return false;
    }

    if (!salePrice.trim()) {
      Alert.alert("Erro", "Por favor, preencha o preço de venda.");
      return false;
    }

    const salePriceValue = getCurrencyValue(salePrice);
    if (salePriceValue <= 0) {
      Alert.alert("Erro", "O preço de venda deve ser maior que zero.");
      return false;
    }

    return true;
  };

  const handleStore = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (barcode.trim()) {
        const existingByBarcode = await productDatabase.findByBarcode(barcode.trim());
        if (existingByBarcode) {
          Alert.alert("Erro", "Já existe um produto cadastrado com este código de barras.");
          return;
        }
      }

      if (reference.trim()) {
        const existingByReference = await productDatabase.findByReference(reference.trim());
        if (existingByReference) {
          Alert.alert("Erro", "Já existe um produto cadastrado com esta referência.");
          return;
        }
      }

      const costPriceValue = costPrice ? Math.round(getCurrencyValue(costPrice) * 100) : undefined;
      const salePriceValue = Math.round(getCurrencyValue(salePrice) * 100);
      const wholesalePriceValue = wholesalePrice ? Math.round(getCurrencyValue(wholesalePrice) * 100) : undefined;

      await productDatabase.store({
        name: name.trim(),
        barcode: barcode.trim() || undefined,
        reference: reference.trim() || undefined,
        description: description.trim() || undefined,
        cost_price: costPriceValue,
        sale_price: salePriceValue,
        wholesale_price: wholesalePriceValue,
        initial_stock: currentStock ? parseInt(currentStock) : 0,
        minimum_stock: minimumStock ? parseInt(minimumStock) : 0,
        category_id: categoryId,
        supplier: supplier.trim() || undefined,
      });

      Alert.alert(
        "Sucesso",
        "Produto criado com sucesso!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating product:", error);
      Alert.alert("Erro", "Falha ao criar produto. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    const hasChanges = name.trim() || barcode.trim() || reference.trim() ||
      description.trim() || costPrice.trim() || salePrice.trim() ||
      wholesalePrice.trim() || currentStock.trim() || minimumStock.trim() ||
      supplier.trim() || categoryId;

    if (hasChanges) {
      Alert.alert(
        "Descartar alterações?",
        "Você tem alterações não salvas. Deseja realmente sair?",
        [
          { text: "Continuar editando", style: "cancel" },
          { text: "Descartar", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const getSelectedCategoryName = () => {
    if (!categoryId) return "Selecionar categoria";
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : "Selecionar categoria";
  };

  const isFormValid = name.trim() && salePrice.trim() && getCurrencyValue(salePrice) > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="cube-outline" size={48} color="#FF6B35" />
          </View>
          <Text style={styles.title}>Novo Produto</Text>
          <Text style={styles.subtitle}>
            Cadastre um novo produto no estoque
          </Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Informações Básicas</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome do Produto *</Text>
            <Input
              placeholder="Ex: iPhone 15, Camiseta Polo, Notebook..."
              value={name}
              onChangeText={setName}
              editable={!isLoading}
              style={styles.input}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Código de Barras</Text>
              <Input
                placeholder="0000000000000"
                value={barcode}
                onChangeText={setBarcode}
                editable={!isLoading}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>Referência</Text>
              <Input
                placeholder="REF-001"
                value={reference}
                onChangeText={setReference}
                editable={!isLoading}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoria</Text>
            <TouchableOpacity
              style={styles.categorySelector}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              disabled={isLoading}
            >
              <Text style={[
                styles.categorySelectorText,
                !categoryId && styles.categorySelectorPlaceholder
              ]}>
                {getSelectedCategoryName()}
              </Text>
              <Ionicons
                name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>

            {showCategoryPicker && (
              <View style={styles.categoryList}>
                <TouchableOpacity
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategoryId(undefined);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={styles.categoryOptionText}>Nenhuma categoria</Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      categoryId === category.id && styles.categoryOptionSelected
                    ]}
                    onPress={() => {
                      setCategoryId(category.id);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      categoryId === category.id && styles.categoryOptionSelectedText
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Descrição</Text>
            <Input
              placeholder="Descrição detalhada do produto (opcional)"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
              style={[styles.input, styles.textArea]}
            />
          </View>

          {/* Preços */}
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Preços</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preço de Venda *</Text>
            <Input
              placeholder="R$ 0,00"
              value={salePrice}
              onChangeText={(text) => setSalePrice(formatCurrency(text))}
              editable={!isLoading}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Preço de Custo</Text>
              <Input
                placeholder="R$ 0,00"
                value={costPrice}
                onChangeText={(text) => setCostPrice(formatCurrency(text))}
                editable={!isLoading}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>Preço Atacado</Text>
              <Input
                placeholder="R$ 0,00"
                value={wholesalePrice}
                onChangeText={(text) => setWholesalePrice(formatCurrency(text))}
                editable={!isLoading}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Estoque */}
          <View style={styles.sectionHeader}>
            <Ionicons name="archive-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Controle de Estoque</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.inputHalf}>
              <Text style={styles.label}>Estoque Atual</Text>
              <Input
                placeholder="0"
                value={currentStock}
                onChangeText={(text) => setCurrentStock(formatNumber(text))}
                editable={!isLoading}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputHalf}>
              <Text style={styles.label}>Estoque Mínimo</Text>
              <Input
                placeholder="0"
                value={minimumStock}
                onChangeText={(text) => setMinimumStock(formatNumber(text))}
                editable={!isLoading}
                style={styles.input}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Fornecedor */}
          <View style={styles.sectionHeader}>
            <Ionicons name="business-outline" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Fornecedor</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fornecedor</Text>
            <Input
              placeholder="Nome do fornecedor (opcional)"
              value={supplier}
              onChangeText={setSupplier}
              editable={!isLoading}
              style={styles.input}
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Os campos marcados com * são obrigatórios. O código de barras e referência devem ser únicos no sistema.
              {'\n\n'}💡 Os preços são salvos em centavos para maior precisão nos cálculos.
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, (!isFormValid || isLoading) && styles.saveButtonDisabled]}
            onPress={handleStore}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text style={styles.saveButtonText}>Salvando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                <Text style={styles.saveButtonText}>Salvar Produto</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categorySelector: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#1e293b',
  },
  categorySelectorPlaceholder: {
    color: '#94a3b8',
  },
  categoryList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryOptionSelected: {
    backgroundColor: '#fff5f0',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#1e293b',
  },
  categoryOptionSelectedText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginTop: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginLeft: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    paddingTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
