import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useProductDatabase } from '@/database/models/Product';
import { useCategoryDatabase } from '@/database/models/Category';
import { Input } from '@/components/Input';
import formatCurrency from '@/components/utils/formatCurrency';
import { SafeAreaView } from 'react-native-safe-area-context';
import WorkArea from '@/components/WorkArea';
import { HeaderDeleteButton } from '@/components/HeaderDeleteButton';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  barcode?: string;
  reference?: string;
  description?: string;
  cost_price?: number;
  sale_price: number;
  wholesale_price?: number;
  initial_stock: number;
  minimum_stock: number;
  category_id?: number;
  supplier?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [supplier, setSupplier] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const productDatabase = useProductDatabase();
  const categoryDatabase = useCategoryDatabase();

  const handleDelete = useCallback(async () => {
    if (!product) return;

    try {
      await productDatabase.remove(product.id);
      router.back();
    } catch (error) {
      console.error('Error deleting:', error);
      throw error;
    }
  }, [product]);

  useEffect(() => {
    loadProduct();
    loadCategories();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const foundProduct = (await productDatabase.show(+id)) as Product | null;

      if (!foundProduct) {
        Alert.alert('Erro', 'Produto não encontrado', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setProduct(foundProduct);
      setName(foundProduct.name || '');
      setBarcode(foundProduct.barcode || '');
      setReference(foundProduct.reference || '');
      setDescription(foundProduct.description || '');
      setCostPrice(
        foundProduct.cost_price
          ? formatCurrency(foundProduct.cost_price.toString())
          : ''
      );
      setSalePrice(formatCurrency(foundProduct.sale_price.toString()));
      setWholesalePrice(
        foundProduct.wholesale_price
          ? formatCurrency(foundProduct.wholesale_price.toString())
          : ''
      );
      setCurrentStock(foundProduct.initial_stock.toString());
      setMinimumStock(foundProduct.minimum_stock.toString());
      setCategoryId(foundProduct.category_id);
      setSupplier(foundProduct.supplier || '');
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Erro', 'Falha ao carregar produto');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await categoryDatabase.index();
      setCategories(
        categoriesData.map(cat => ({
          id: cat.id!,
          name: cat.name!,
        }))
      );
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const formatNumber = (text: string) => {
    return text.replace(/\D/g, '');
  };

  const getCurrencyValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o nome do produto.');
      return false;
    }

    if (!salePrice.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o preço de venda.');
      return false;
    }

    const salePriceValue = getCurrencyValue(salePrice);
    if (salePriceValue <= 0) {
      Alert.alert('Erro', 'O preço de venda deve ser maior que zero.');
      return false;
    }

    if (!minimumStock || isNaN(parseInt(minimumStock))) {
      Alert.alert('Erro', 'O estoque mínimo deve ser um número válido.');
      return false;
    }

    if (!currentStock || isNaN(parseInt(minimumStock))) {
      Alert.alert('Erro', 'O estoque inicial deve ser um número válido.');
      return false;
    }

    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm() || !product) return;

    setIsSaving(true);
    try {
      if (barcode.trim() && barcode.trim() !== (product.barcode || '')) {
        const existingByBarcode = await productDatabase.findByBarcode(
          barcode.trim()
        );
        if (existingByBarcode && existingByBarcode.id !== product.id) {
          Alert.alert(
            'Erro',
            'Já existe outro produto cadastrado com este código de barras.'
          );
          return;
        }
      }

      if (reference.trim() && reference.trim() !== (product.reference || '')) {
        const existingByReference = await productDatabase.findByReference(
          reference.trim()
        );
        if (existingByReference && existingByReference.id !== product.id) {
          Alert.alert(
            'Erro',
            'Já existe outro produto cadastrado com esta referência.'
          );
          return;
        }
      }

      const costPriceValue = costPrice
        ? Math.round(getCurrencyValue(costPrice) * 100)
        : undefined;
      const salePriceValue = Math.round(getCurrencyValue(salePrice) * 100);
      const wholesalePriceValue = wholesalePrice
        ? Math.round(getCurrencyValue(wholesalePrice) * 100)
        : undefined;

      await productDatabase.update({
        id: product.id,
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

      Alert.alert('Sucesso', 'Produto atualizado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Erro', 'Falha ao atualizar produto. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;

    try {
      await productDatabase.toggleActive(product.id);
      const updatedProduct = {
        ...product,
        active: product.active === 1 ? 0 : 1,
      };
      setProduct(updatedProduct);

      const status = updatedProduct.active === 1 ? 'ativado' : 'desativado';
      Alert.alert('Sucesso', `Produto ${status} com sucesso!`);
    } catch (error) {
      console.error('Error toggling product status:', error);
      Alert.alert('Erro', 'Falha ao alterar status do produto');
    }
  };

  const getSelectedCategoryName = () => {
    if (!categoryId) return 'Nenhuma categoria';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Categoria não encontrada';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#FF6B35' />
        <Text style={styles.loadingText}>Carregando produto...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle-outline' size={64} color='#ef4444' />
        <Text style={styles.errorTitle}>Produto não encontrado</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isFormValid =
    name.trim() && salePrice.trim() && getCurrencyValue(salePrice) > 0;

  return (
    <WorkArea>
      <HeaderDeleteButton
        onDelete={handleDelete}
        itemName={product?.name || ''}
        itemType='o produto'
        successMessage='Produto excluído com sucesso!'
      />
      <View style={styles.headerSection}>
        <View style={styles.iconContainer}>
          <Ionicons name='cube-outline' size={48} color='#FF6B35' />
        </View>
        <Text style={styles.title}>Editar Produto</Text>
        <Text style={styles.subtitle}>Atualize as informações do produto</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.statusToggle,
          product.active === 1 && styles.statusToggleActive,
        ]}
        onPress={handleToggleActive}
        disabled={isSaving}
      >
        <View
          style={[
            styles.statusIndicator,
            product.active === 1 && styles.statusIndicatorActive,
          ]}
        >
          {product.active === 1 && (
            <Ionicons name='checkmark' size={12} color='#ffffff' />
          )}
        </View>
        <Text
          style={[
            styles.statusText,
            product.active === 1 && styles.statusTextActive,
          ]}
        >
          {product.active === 1 ? 'Produto Ativo' : 'Produto Inativo'}
        </Text>
      </TouchableOpacity>

      <View style={styles.formSection}>
        {/* Informações Básicas */}
        <View style={styles.sectionHeader}>
          <Ionicons
            name='information-circle-outline'
            size={20}
            color='#FF6B35'
          />
          <Text style={styles.sectionTitle}>Informações Básicas</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Produto *</Text>
          <Input
            placeholder='Ex: iPhone 15, Camiseta Polo, Notebook...'
            value={name}
            onChangeText={setName}
            editable={!isSaving}
            style={styles.input}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Código de Barras</Text>
            <Input
              placeholder='0000000000000'
              value={barcode}
              onChangeText={setBarcode}
              editable={!isSaving}
              style={styles.input}
              keyboardType='numeric'
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.label}>Referência</Text>
            <Input
              placeholder='REF-001'
              value={reference}
              onChangeText={setReference}
              editable={!isSaving}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Categoria</Text>
          <TouchableOpacity
            style={styles.categorySelector}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            disabled={isSaving}
          >
            <Text
              style={[
                styles.categorySelectorText,
                !categoryId && styles.categorySelectorPlaceholder,
              ]}
            >
              {getSelectedCategoryName()}
            </Text>
            <Ionicons
              name={showCategoryPicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color='#64748b'
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
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    categoryId === category.id && styles.categoryOptionSelected,
                  ]}
                  onPress={() => {
                    setCategoryId(category.id);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      categoryId === category.id &&
                        styles.categoryOptionSelectedText,
                    ]}
                  >
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
            placeholder='Descrição detalhada do produto (opcional)'
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            editable={!isSaving}
            style={[styles.input, styles.textArea]}
          />
        </View>

        {/* Preços */}
        <View style={styles.sectionHeader}>
          <Ionicons name='pricetag-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Preços</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Preço de Venda *</Text>
          <Input
            placeholder='R$ 0,00'
            value={salePrice}
            onChangeText={text => setSalePrice(formatCurrency(text))}
            editable={!isSaving}
            style={styles.input}
            keyboardType='numeric'
          />
        </View>

        {/* Estoque */}
        <View style={styles.sectionHeader}>
          <Ionicons name='archive-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Controle de Estoque</Text>
        </View>

        <View style={styles.row}>
          <View style={styles.inputHalf}>
            <Text style={styles.label}>Estoque Inicial</Text>
            <Input
              placeholder='0'
              value={currentStock}
              onChangeText={text => setCurrentStock(formatNumber(text))}
              editable={!isSaving}
              style={styles.input}
              keyboardType='numeric'
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.label}>Estoque Mínimo</Text>
            <Input
              placeholder='0'
              value={minimumStock}
              onChangeText={text => setMinimumStock(formatNumber(text))}
              editable={!isSaving}
              style={styles.input}
              keyboardType='numeric'
            />
          </View>
        </View>

        {/* Fornecedor */}
        <View style={styles.sectionHeader}>
          <Ionicons name='business-outline' size={20} color='#FF6B35' />
          <Text style={styles.sectionTitle}>Fornecedor</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fornecedor</Text>
          <Input
            placeholder='Nome do fornecedor (opcional)'
            value={supplier}
            onChangeText={setSupplier}
            editable={!isSaving}
            style={styles.input}
          />
        </View>

        <View style={styles.infoSection}>
          <View style={[styles.infoCard, styles.warningCard]}>
            <Ionicons name='warning-outline' size={20} color='#f59e0b' />
            <Text style={[styles.infoText, styles.warningText]}>
              Não é possível excluir produtos que possuem vendas ou
              movimentações de estoque.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isActive ? styles.deactivateButton : styles.activateButton,
          ]}
          onPress={handleToggleActive}
        >
          <Ionicons
            name={isActive ? 'pause-outline' : 'play-outline'}
            size={16}
            color={isActive ? '#f59e0b' : '#22c55e'}
          />
          <Text
            style={[
              styles.toggleButtonText,
              isActive
                ? styles.deactivateButtonText
                : styles.activateButtonText,
            ]}
          >
            {isActive ? 'Desativar' : 'Ativar'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!isFormValid || isSaving) && styles.saveButtonDisabled,
          ]}
          onPress={handleUpdate}
          disabled={!isFormValid || isSaving}
        >
          {isSaving ? (
            <>
              <ActivityIndicator size='small' color='#ffffff' />
              <Text style={styles.saveButtonText}>Salvando...</Text>
            </>
          ) : (
            <>
              <Ionicons name='checkmark-outline' size={16} color='#ffffff' />
              <Text style={styles.saveButtonText}>Salvar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </WorkArea>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
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
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statusToggleActive: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicatorActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  statusText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#22c55e',
    fontWeight: '600',
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
  infoSection: {
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  warningCard: {
    backgroundColor: '#fffbeb',
    borderLeftColor: '#f59e0b',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
    marginLeft: 12,
  },
  warningText: {
    color: '#92400e',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
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
    flex: 1,
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
