import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import CustomDialog from '@/components/modals/CustomDialog';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useProductDatabase } from '@/database/models/Product';
import { useCategoryDatabase } from '@/database/models/Category';
import formatCurrency from '@/components/utils/formatCurrency';
import WorkArea from '@/components/WorkArea';
import SearchableSelect from '@/components/SearchableSelect';
import CollapsibleSection from '@/components/CollapsibleSection';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormSection, FormInput, FormRow } from '@/components/Form';

interface Category {
  id: number;
  name: string;
}

export default function CreateProduct() {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minimumStock, setMinimumStock] = useState('1');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [supplier, setSupplier] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogIcon, setDialogIcon] = useState<any>('information-circle');
  const [dialogIconColor, setDialogIconColor] = useState('#3b82f6');
  const [dialogButtons, setDialogButtons] = useState<any[]>([]);

  const productDatabase = useProductDatabase();
  const categoryDatabase = useCategoryDatabase();

  useEffect(() => {
    loadCategories();
  }, []);

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

    if (!currentStock || isNaN(parseInt(minimumStock))) {
      setDialogTitle('Erro');
      setDialogMessage('O estoque inicial deve ser um número válido.');
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

  const handleStore = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (barcode.trim()) {
        const existingByBarcode = await productDatabase.findByBarcode(
          barcode.trim()
        );
        if (existingByBarcode) {
          setDialogTitle('Erro');
          setDialogMessage('Já existe um produto cadastrado com este código de barras.');
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

      if (reference.trim()) {
        const existingByReference = await productDatabase.findByReference(
          reference.trim()
        );
        if (existingByReference) {
          setDialogTitle('Erro');
          setDialogMessage('Já existe um produto cadastrado com esta referência.');
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

      await productDatabase.store({
        name: name.trim(),
        barcode: barcode.trim() || undefined,
        reference: reference.trim() || undefined,
        description: description.trim() || undefined,
        cost_price: costPriceValue,
        sale_price: salePriceValue,
        wholesale_price: wholesalePriceValue,
        initial_stock: currentStock ? parseInt(currentStock) : 0,
        minimum_stock: minimumStock ? parseInt(minimumStock) : 1,
        category_id: categoryId,
        supplier: supplier.trim() || undefined,
      });

      setDialogTitle('Sucesso');
      setDialogMessage('Produto criado com sucesso!');
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
      console.error('Error creating product:', error);
      setDialogTitle('Erro');
      setDialogMessage('Falha ao criar produto. Tente novamente.');
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

  const handleCancel = () => {
    const hasChanges =
      name.trim() ||
      barcode.trim() ||
      reference.trim() ||
      description.trim() ||
      costPrice.trim() ||
      salePrice.trim() ||
      wholesalePrice.trim() ||
      currentStock.trim() ||
      minimumStock.trim() ||
      supplier.trim() ||
      categoryId;

    if (hasChanges) {
      setDialogTitle('Descartar alterações?');
      setDialogMessage('Você tem alterações não salvas. Deseja realmente sair?');
      setDialogIcon('help-circle');
      setDialogIconColor('#f59e0b');
      setDialogButtons([
        {
          text: 'Continuar editando',
          onPress: () => setDialogVisible(false),
          style: 'default',
        },
        {
          text: 'Descartar',
          onPress: () => {
            setDialogVisible(false);
            router.back();
          },
          style: 'danger',
        },
      ]);
      setDialogVisible(true);
    } else {
      router.back();
    }
  };

  const isFormValid =
    name.trim() && salePrice.trim() && getCurrencyValue(salePrice) > 0;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <WorkArea>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Ionicons name='bag-outline' size={40} color='#FF6B35' />
          </View>
          <Text style={styles.title}>Novo Produto</Text>
          <Text style={styles.subtitle}>Cadastre um novo produto no estoque</Text>
        </View>

        <View style={styles.formSection}>
          <FormSection
            icon='information-circle-outline'
            title='Informações Principais'
          >
            <FormInput
              label='Nome do Produto'
              placeholder='Nome do produto'
              value={name}
              onChangeText={setName}
              editable={!isLoading}
              required
            />

            <View style={styles.inputGroup}>
              <SearchableSelect
                label='Categoria'
                options={categories.map(cat => ({
                  label: cat.name,
                  value: cat.id,
                }))}
                selectedValue={categoryId}
                onValueChange={(value: string | number) => setCategoryId(value as number)}
                placeholder='Selecionar categoria'
                enabled={!isLoading}
              />
            </View>

            <FormInput
              label='Descrição'
              placeholder='Descrição detalhada do produto (opcional)'
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              editable={!isLoading}
              style={styles.textArea}
            />
          </FormSection>

          {/* Preços */}
          <FormSection icon='pricetag-outline' title='Preço'>
            <FormInput
              label='Preço de Venda'
              placeholder='R$ 0,00'
              value={salePrice}
              onChangeText={text => setSalePrice(formatCurrency(text))}
              editable={!isLoading}
              keyboardType='numeric'
              required
            />
          </FormSection>

          {/* Estoque Simplificado */}
          <FormSection icon='archive-outline' title='Estoque'>
            <View style={styles.stockSimplifiedContainer}>
              <FormRow>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label='Inicial'
                    placeholder='0'
                    value={currentStock}
                    onChangeText={text => setCurrentStock(formatNumber(text))}
                    editable={!isLoading}
                    style={styles.stockInput}
                    keyboardType='numeric'
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <FormInput
                    label='Mínimo'
                    placeholder='1'
                    value={minimumStock}
                    onChangeText={text => setMinimumStock(formatNumber(text))}
                    editable={!isLoading}
                    style={styles.stockInput}
                    keyboardType='numeric'
                    containerStyle={{ marginBottom: 0 }}
                  />
                </View>
              </FormRow>
            </View>
          </FormSection>

          {/* Campos Secundários - Colapsados */}
          <CollapsibleSection
            title='Informações Adicionais'
            icon='documents-outline'
            iconColor='#64748b'
            defaultCollapsed={true}
            badge='Opcional'
          >
            <FormRow>
              <View style={{ flex: 1 }}>
                <FormInput
                  label='Código de Barras'
                  placeholder='0000000000000'
                  value={barcode}
                  onChangeText={setBarcode}
                  editable={!isLoading}
                  keyboardType='numeric'
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <FormInput
                  label='Referência'
                  placeholder='REF-001'
                  value={reference}
                  onChangeText={setReference}
                  editable={!isLoading}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
            </FormRow>

            <FormInput
              label='Fornecedor'
              placeholder='Nome do fornecedor'
              value={supplier}
              onChangeText={setSupplier}
              editable={!isLoading}
            />
          </CollapsibleSection>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid || isLoading) && styles.saveButtonDisabled,
            ]}
            onPress={handleStore}
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
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
    marginBottom: 24,
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
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 12,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  stockSimplifiedContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  stockInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
    color: '#1e293b',
    textAlign: 'center',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
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
});
