import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import CustomDialog from '@/components/modals/CustomDialog';
import { useSQLiteContext } from 'expo-sqlite';
import { storeStockMovement } from '@/database/utils/stockMovementUtils';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useProductDatabase } from '@/database/models/Product';
import { useCategoryDatabase } from '@/database/models/Category';
import { Input } from '@/components/Input';
import formatCurrency from '@/components/utils/formatCurrency';
import WorkArea from '@/components/WorkArea';
import { HeaderDeleteButton } from '@/components/HeaderDeleteButton';
import SearchableSelect from '@/components/SearchableSelect';
import CollapsibleSection from '@/components/CollapsibleSection';
import StockAdjustmentModal, { StockAdjustmentType } from '@/components/modals/StockAdjustmentModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormSection, FormInput, FormSelector, FormRow, InfoCard } from '@/components/Form';


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
  current_stock: number;
  minimum_stock: number;
  category_id?: number;
  supplier?: string;
  active: number;
  created_at: string;
  updated_at: string;
}

interface StockMovement {
  id: number;
  product_id: number;
  type: string;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [movementsPage, setMovementsPage] = useState(1);
  const [totalMovements, setTotalMovements] = useState(0);
  const ITEMS_PER_PAGE = 10;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogIcon, setDialogIcon] = useState<any>('information-circle');
  const [dialogIconColor, setDialogIconColor] = useState('#3b82f6');
  const [dialogButtons, setDialogButtons] = useState<any[]>([]);

  const productDatabase = useProductDatabase();
  const categoryDatabase = useCategoryDatabase();
  const database = useSQLiteContext();

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
    loadStockMovements();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const foundProduct = (await productDatabase.show(+id)) as Product | null;

      if (!foundProduct) {
        setDialogTitle('Erro');
        setDialogMessage('Produto não encontrado');
        setDialogIcon('alert-circle');
        setDialogIconColor('#ef4444');
        setDialogButtons([{
          text: 'OK',
          onPress: () => {
            setDialogVisible(false);
            router.back();
          },
          style: 'primary',
        }]);
        setDialogVisible(true);
        return;
      }

      setIsActive(foundProduct.active === 1);
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

      setMinimumStock(foundProduct.minimum_stock ? foundProduct.minimum_stock.toString() : '1');
      setCategoryId(foundProduct.category_id);
      setSupplier(foundProduct.supplier || '');
    } catch (error) {
      console.error('Error loading product:', error);
      setDialogTitle('Erro');
      setDialogMessage('Falha ao carregar produto');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => setDialogVisible(false),
        style: 'primary',
      }]);
      setDialogVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await categoryDatabase.index();
      setCategories(
        categoriesData
          .filter((item) => item.id !== undefined && item.name !== undefined)
          .map((item) => ({
            id: item.id!,
            name: item.name!,
          }))
      );
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStockMovements = async (page: number = 1) => {
    if (!id) return;

    try {
      setIsLoadingMovements(true);

      const total = await productDatabase.countStockMovements(+id);
      setTotalMovements(total);

      const result = await productDatabase.getStockMovements(+id, page, ITEMS_PER_PAGE);
      setStockMovements(result);
      setMovementsPage(page);
    } catch (error) {
      console.error('Error loading stock movements:', error);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  const formatNumber = (text: string) => {
    return text.replace(/\D/g, '');
  };

  const handleStockAdjust = async (params: {
    type: StockAdjustmentType;
    quantity: number;
    notes: string;
  }) => {
    if (!product) return;

    try {
      let quantity = 0;
      let type: 'stock_in' | 'sale' | 'return' | 'adjustment' = 'adjustment';
      let notes = params.notes;

      if (params.type === 'add') {
        quantity = params.quantity;
        type = 'stock_in';
        notes = `Entrada: ${notes}`;
      } else if (params.type === 'remove') {
        quantity = -params.quantity;
        type = 'adjustment';
        notes = `Saída: ${notes}`;
      } else if (params.type === 'set') {
        const currentStockValue = product.current_stock || 0;
        const difference = params.quantity - currentStockValue;
        quantity = difference;
        type = difference > 0 ? 'stock_in' : 'adjustment';
        notes = `Ajuste para ${params.quantity}: ${notes}`;
      }

      await storeStockMovement(database, {
        sale_id: null,
        product_id: product.id,
        type: type,
        quantity: quantity,
        unit_value: product.cost_price || 0,
        total_value: quantity * (product.cost_price || 0),
        notes: notes,
      });

      setDialogTitle('Sucesso');
      setDialogMessage('Estoque ajustado com sucesso!');
      setDialogIcon('checkmark-circle');
      setDialogIconColor('#22c55e');
      setDialogButtons([{
        text: 'OK',
        onPress: () => setDialogVisible(false),
        style: 'primary',
      }]);
      setDialogVisible(true);

      await loadProduct();
      await loadStockMovements();
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setDialogTitle('Erro');
      setDialogMessage('Falha ao ajustar estoque');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => setDialogVisible(false),
        style: 'primary',
      }]);
      setDialogVisible(true);
      throw error;
    }
  };

  const getCurrencyValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    const cleanValue = formattedValue.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(cleanValue) || 0;
  };

  const validateForm = () => {
    if (!name.trim()) {
      setDialogTitle('Erro');
      setDialogMessage('Por favor, preencha o nome do produto.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => setDialogVisible(false),
        style: 'primary',
      }]);
      setDialogVisible(true);
      return false;
    }

    if (!salePrice.trim()) {
      setDialogTitle('Erro');
      setDialogMessage('Por favor, preencha o preço de venda.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => setDialogVisible(false),
        style: 'primary',
      }]);
      setDialogVisible(true);
      return false;
    }

    const salePriceValue = getCurrencyValue(salePrice);
    if (salePriceValue <= 0) {
      setDialogTitle('Erro');
      setDialogMessage('O preço de venda deve ser maior que zero.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => setDialogVisible(false),
        style: 'primary',
      }]);
      setDialogVisible(true);
      return false;
    }

    if (!minimumStock || isNaN(parseInt(minimumStock))) {
      setDialogTitle('Erro');
      setDialogMessage('O estoque mínimo deve ser um número válido.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => setDialogVisible(false),
        style: 'primary',
      }]);
      setDialogVisible(true);
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
          setDialogTitle('Erro');
          setDialogMessage('Já existe outro produto cadastrado com este código de barras.');
          setDialogIcon('alert-circle');
          setDialogIconColor('#ef4444');
          setDialogButtons([{
            text: 'OK',
            onPress: () => setDialogVisible(false),
            style: 'primary',
          }]);
          setDialogVisible(true);
          return;
        }
      }

      if (reference.trim() && reference.trim() !== (product.reference || '')) {
        const existingByReference = await productDatabase.findByReference(
          reference.trim()
        );
        if (existingByReference && existingByReference.id !== product.id) {
          setDialogTitle('Erro');
          setDialogMessage('Já existe outro produto cadastrado com esta referência.');
          setDialogIcon('alert-circle');
          setDialogIconColor('#ef4444');
          setDialogButtons([{
            text: 'OK',
            onPress: () => setDialogVisible(false),
            style: 'primary',
          }]);
          setDialogVisible(true);
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
        id: +id,
        name: name.trim(),
        barcode: barcode.trim() || undefined,
        reference: reference.trim() || undefined,
        description: description.trim() || undefined,
        cost_price: costPriceValue,
        sale_price: salePriceValue,
        wholesale_price: wholesalePriceValue,
        minimum_stock: minimumStock ? parseInt(minimumStock) : 1,
        category_id: categoryId,
        supplier: supplier.trim() || undefined,
      });

      setDialogTitle('Sucesso');
      setDialogMessage('Produto atualizado com sucesso!');
      setDialogIcon('checkmark-circle');
      setDialogIconColor('#22c55e');
      setDialogButtons([{
        text: 'OK',
        onPress: () => {
          setDialogVisible(false);
          router.back();
        },
        style: 'primary',
      }]);
      setDialogVisible(true);
    } catch (error) {
      console.error('Error updating product:', error);
      setDialogTitle('Erro');
      setDialogMessage('Falha ao atualizar produto. Tente novamente.');
      setDialogIcon('alert-circle');
      setDialogIconColor('#ef4444');
      setDialogButtons([{
        text: 'OK',
        onPress: () => setDialogVisible(false),
        style: 'primary',
      }]);
      setDialogVisible(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!product) return;

    const nextStatus = product.active === 1 ? 'desativar' : 'ativar';
    setDialogTitle('Confirmação');
    setDialogMessage(`Tem certeza que deseja ${nextStatus} este produto?`);
    setDialogIcon('help-circle');
    setDialogIconColor('#f59e0b');
    setDialogButtons([
      {
        text: 'Cancelar',
        onPress: () => setDialogVisible(false),
        style: 'default',
      },
      {
        text: 'Confirmar',
        onPress: async () => {
          try {
            setDialogVisible(false);
            await productDatabase.toggleActive(product.id);
            const updatedProduct = {
              ...product,
              active: product.active === 1 ? 0 : 1,
            };
            setProduct(updatedProduct);

            const status =
              updatedProduct.active === 1 ? 'ativado' : 'desativado';

            setDialogTitle('Sucesso');
            setDialogMessage(`Produto ${status} com sucesso!`);
            setDialogIcon('checkmark-circle');
            setDialogIconColor('#22c55e');
            setDialogButtons([{
              text: 'OK',
              onPress: () => {
                setDialogVisible(false);
                router.back();
              },
              style: 'primary',
            }]);
            setDialogVisible(true);
          } catch (error) {
            console.error('Error toggling product status:', error);
            setDialogTitle('Erro');
            setDialogMessage('Falha ao alterar status do produto');
            setDialogIcon('alert-circle');
            setDialogIconColor('#ef4444');
            setDialogButtons([{
              text: 'OK',
              onPress: () => setDialogVisible(false),
              style: 'primary',
            }]);
            setDialogVisible(true);
          }
        },
        style: 'danger',
      },
    ]);
    setDialogVisible(true);
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

  const categoryOptions = categories.map(category => ({
    label: category.name,
    value: category.id,
  }));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <WorkArea>
        <HeaderDeleteButton
          onDelete={handleDelete}
          itemName={product?.name || ''}
          itemType='o produto'
          successMessage='Produto excluído com sucesso!'
        />
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='bag-outline' size={40} color='#FF6B35' />
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
          {/* Informações Principais */}
          <FormSection icon='information-circle-outline' title='Informações Principais'>
            <FormInput
              label='Nome do Produto'
              required
              placeholder='Nome do produto'
              value={name}
              onChangeText={setName}
              editable={!isSaving}
            />

            <SearchableSelect
              label='Categoria'
              selectedValue={categoryId}
              onValueChange={value => setCategoryId(value as number)}
              options={categoryOptions}
              enabled={!isSaving}
              placeholder='Selecionar categoria'
            />

            <FormInput
              label='Descrição'
              placeholder='Descrição detalhada do produto (opcional)'
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isSaving}
              style={styles.textArea}
            />
          </FormSection>

          {/* Preço */}
          <FormSection icon='pricetag-outline' title='Preço'>
            <FormInput
              label='Preço de Venda'
              required
              placeholder='R$ 0,00'
              value={salePrice}
              onChangeText={text => setSalePrice(formatCurrency(text))}
              editable={!isSaving}
              keyboardType='numeric'
            />
          </FormSection>

          {/* Estoque */}
          <FormSection icon='archive-outline' title='Controle de Estoque'>
            <View style={styles.stockInfoContainer}>
              <View style={styles.stockCurrentBox}>
                <Text style={styles.stockCurrentLabel}>Estoque Atual</Text>
                <Text style={styles.stockCurrentValue}>
                  {product?.current_stock || 0} unidades
                </Text>
              </View>

              <TouchableOpacity
                style={styles.adjustStockButton}
                onPress={() => setShowStockAdjustModal(true)}
                disabled={isSaving}
              >
                <Ionicons name='create-outline' size={16} color='#ffffff' />
                <Text style={styles.adjustStockButtonText}>Ajustar Estoque</Text>
              </TouchableOpacity>
            </View>

            <FormInput
              label='Estoque Mínimo'
              placeholder='1'
              value={minimumStock}
              onChangeText={text => setMinimumStock(formatNumber(text))}
              editable={!isSaving}
              keyboardType='numeric'
            />
          </FormSection>

          {/* Informações Adicionais - Seção Colapsável */}
          <CollapsibleSection
            title='Informações Adicionais'
            icon='documents-outline'
            iconColor='#64748b'
            defaultCollapsed={true}
            badge='Opcional'
          >
            <FormRow>
              <View style={styles.inputHalf}>
                <FormInput
                  label='Código de Barras'
                  placeholder='0000000000000'
                  value={barcode}
                  onChangeText={setBarcode}
                  editable={!isSaving}
                  keyboardType='numeric'
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>

              <View style={styles.inputHalf}>
                <FormInput
                  label='Referência'
                  placeholder='REF-001'
                  value={reference}
                  onChangeText={setReference}
                  editable={!isSaving}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </FormRow>

            <FormInput
              label='Fornecedor'
              placeholder='Nome do fornecedor'
              value={supplier}
              onChangeText={setSupplier}
              editable={!isSaving}
            />
          </CollapsibleSection>

          <CollapsibleSection
            title='Histórico de Movimentações'
            icon='time-outline'
            iconColor='#8b5cf6'
            defaultCollapsed={true}
            badge={totalMovements > 0 ? totalMovements.toString() : undefined}
          >
            {isLoadingMovements ? (
              <View style={styles.loadingMovementsContainer}>
                <ActivityIndicator size='small' color='#8b5cf6' />
                <Text style={styles.loadingMovementsText}>Carregando...</Text>
              </View>
            ) : stockMovements.length === 0 ? (
              <View style={styles.emptyMovementsContainer}>
                <Ionicons name='file-tray-outline' size={48} color='#cbd5e1' />
                <Text style={styles.emptyMovementsText}>Nenhuma movimentação registrada</Text>
              </View>
            ) : (
              <View style={styles.movementsContainer}>
                {stockMovements.map((movement, index) => {
                  const isPositive = movement.quantity > 0;

                  const movementDate = new Date(movement.created_at);
                  movementDate.setHours(movementDate.getHours() - 3)

                  const formattedDate = movementDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });
                  const formattedTime = movementDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  let typeLabel = 'Movimentação';
                  let typeIcon: any = 'swap-horizontal';
                  let typeColor = '#64748b';

                  if (movement.type === 'stock_in') {
                    typeLabel = 'Entrada';
                    typeIcon = 'arrow-down-circle';
                    typeColor = '#22c55e';
                  } else if (movement.type === 'sale') {
                    typeLabel = 'Venda';
                    typeIcon = 'cart';
                    typeColor = '#ef4444';
                  } else if (movement.type === 'return') {
                    typeLabel = 'Devolução';
                    typeIcon = 'return-up-back';
                    typeColor = '#3b82f6';
                  } else if (movement.type === 'adjustment') {
                    typeLabel = 'Ajuste';
                    typeIcon = 'create';
                    typeColor = '#f59e0b';
                  }

                  return (
                    <View
                      key={movement.id}
                      style={[
                        styles.movementItem,
                        index !== stockMovements.length - 1 && styles.movementItemBorder,
                      ]}
                    >
                      <View style={styles.movementHeader}>
                        <View style={[styles.movementTypeIcon, { backgroundColor: typeColor + '20' }]}>
                          <Ionicons name={typeIcon} size={20} color={typeColor} />
                        </View>
                        <View style={styles.movementHeaderInfo}>
                          <Text style={styles.movementType}>{typeLabel}</Text>
                          <Text style={styles.movementDate}>
                            {formattedDate} às {formattedTime}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.movementQuantityBadge,
                            { backgroundColor: isPositive ? '#dcfce7' : '#fee2e2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.movementQuantity,
                              { color: isPositive ? '#16a34a' : '#dc2626' },
                            ]}
                          >
                            {isPositive ? '+' : ''}{movement.quantity}
                          </Text>
                        </View>
                      </View>
                      {movement.notes && (
                        <Text style={styles.movementNotes}>{movement.notes}</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {totalMovements > ITEMS_PER_PAGE && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    movementsPage === 1 && styles.paginationButtonDisabled,
                  ]}
                  onPress={() => loadStockMovements(movementsPage - 1)}
                  disabled={movementsPage === 1 || isLoadingMovements}
                >
                  <Ionicons
                    name='chevron-back'
                    size={20}
                    color={movementsPage === 1 ? '#cbd5e1' : '#64748b'}
                  />
                </TouchableOpacity>

                <View style={styles.paginationInfo}>
                  <Text style={styles.paginationText}>
                    Página {movementsPage} de {Math.ceil(totalMovements / ITEMS_PER_PAGE)}
                  </Text>
                  <Text style={styles.paginationSubtext}>
                    {totalMovements} {totalMovements === 1 ? 'registro' : 'registros'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    movementsPage >= Math.ceil(totalMovements / ITEMS_PER_PAGE) &&
                    styles.paginationButtonDisabled,
                  ]}
                  onPress={() => loadStockMovements(movementsPage + 1)}
                  disabled={
                    movementsPage >= Math.ceil(totalMovements / ITEMS_PER_PAGE) ||
                    isLoadingMovements
                  }
                >
                  <Ionicons
                    name='chevron-forward'
                    size={20}
                    color={
                      movementsPage >= Math.ceil(totalMovements / ITEMS_PER_PAGE)
                        ? '#cbd5e1'
                        : '#64748b'
                    }
                  />
                </TouchableOpacity>
              </View>
            )}
          </CollapsibleSection>

          <InfoCard variant='warning' icon='warning-outline'>
            Não é possível excluir produtos que possuem vendas ou movimentações
            de estoque.
          </InfoCard>
        </View>

        <View style={styles.actionButtons}>
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

        {/* Modal de Ajuste de Estoque */}
        <StockAdjustmentModal
          visible={showStockAdjustModal}
          productName={product?.name || ''}
          currentStock={product?.current_stock || 0}
          onClose={() => setShowStockAdjustModal(false)}
          onConfirm={handleStockAdjust}
        />

        {/* Custom Dialog */}
        <CustomDialog
          visible={dialogVisible}
          title={dialogTitle}
          message={dialogMessage}
          icon={dialogIcon}
          iconColor={dialogIconColor}
          buttons={dialogButtons}
          onClose={() => setDialogVisible(false)}
        />
      </WorkArea>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activateButton: {
    backgroundColor: '#22c55e',
  },
  deactivateButton: {
    backgroundColor: '#ef4444',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activateButtonText: {
    color: '#ffffff',
  },
  deactivateButtonText: {
    color: '#ffffff',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#fff5f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  statusToggleActive: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIndicatorActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  statusText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statusTextActive: {
    color: '#22c55e',
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 20,
  },
  inputHalf: {
    flex: 1,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  stockInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  stockCurrentBox: {
    flex: 1,
  },
  stockCurrentLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  stockCurrentValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  adjustStockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  adjustStockButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingMovementsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10,
  },
  loadingMovementsText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyMovementsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyMovementsText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 10,
  },
  movementsContainer: {
    gap: 0,
  },
  movementItem: {
    paddingVertical: 12,
  },
  movementItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  movementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  movementTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  movementHeaderInfo: {
    flex: 1,
  },
  movementType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  movementDate: {
    fontSize: 12,
    color: '#64748b',
  },
  movementQuantityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  movementQuantity: {
    fontSize: 14,
    fontWeight: '700',
  },
  movementNotes: {
    fontSize: 13,
    color: '#475569',
    marginTop: 6,
    marginLeft: 46,
    lineHeight: 18,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  paginationButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paginationButtonDisabled: {
    backgroundColor: '#ffffff',
    borderColor: '#f1f5f9',
  },
  paginationInfo: {
    alignItems: 'center',
    flex: 1,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  paginationSubtext: {
    fontSize: 12,
    color: '#64748b',
  },
});
