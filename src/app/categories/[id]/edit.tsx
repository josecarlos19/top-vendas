import React, { useState, useEffect, useCallback } from 'react';
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
import { useCategoryDatabase } from '@/database/models/Category';
import { Input } from '@/components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderDeleteButton } from '@/components/HeaderDeleteButton';

interface Category {
  id: number;
  name: string;
  description?: string;
  ativo: number;
  created_at: string;
  updated_at: string;
}

export default function EditCategory() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigation = useNavigation();
  const categoryDatabase = useCategoryDatabase();

  const handleDelete = useCallback(() => {
    if (!category) return;

    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  }, [category]);

  const loadCategory = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const foundCategory = (await categoryDatabase.show(
        +id
      )) as Category | null;

      if (!foundCategory) {
        Alert.alert('Erro', 'Categoria não encontrada');
        router.back();
        return;
      }

      if (foundCategory) {
        setCategory(foundCategory);
        setName(foundCategory.name || '');
        setDescription(foundCategory.description || '');
      } else {
        Alert.alert('Erro', 'Categoria não encontrada', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      console.error('Error loading category:', error);
      Alert.alert('Erro', 'Falha ao carregar categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha o name da categoria.');
      return;
    }

    if (!category) return;

    setIsSaving(true);
    try {
      await categoryDatabase.update({
        id: category.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });

      Alert.alert('Sucesso', 'Categoria atualizada com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Erro', 'Falha ao atualizar categoria. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!category) return;

    try {
      await categoryDatabase.remove(category.id);
      Alert.alert('Sucesso', 'Categoria excluída com sucesso!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error deleting category:', error);
      Alert.alert('Erro', 'Falha ao excluir categoria');
    }
  };

  useEffect(() => {
    loadCategory();
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#FF6B35' />
        <Text style={styles.loadingText}>Carregando categoria...</Text>
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name='alert-circle-outline' size={64} color='#ef4444' />
        <Text style={styles.errorTitle}>Categoria não encontrada</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <HeaderDeleteButton
        onDelete={handleDelete}
        itemName={category?.name || ''}
        itemType='a categoria'
        successMessage='Categoria excluída com sucesso!'
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'
        >
          <View style={styles.headerSection}>
            <View style={styles.iconContainer}>
              <Ionicons name='pencil-outline' size={48} color='#FF6B35' />
            </View>
            <Text style={styles.title}>Editar Categoria</Text>
            <Text style={styles.subtitle}>
              Atualize as informações da categoria
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Categoria*</Text>
              <Input
                placeholder='Ex: Eletrônicos, Roupas, Livros...'
                value={name}
                onChangeText={setName}
                editable={!isSaving}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição</Text>
              <Input
                placeholder='Descreva brevemente esta categoria (opcional)'
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                editable={!isSaving}
                style={[styles.input, styles.textArea]}
              />
            </View>

            <View style={styles.infoSection}>
              <View style={[styles.infoCard, styles.warningCard]}>
                <Ionicons name='warning-outline' size={20} color='#f59e0b' />
                <Text style={[styles.infoText, styles.warningText]}>
                  Não é possível excluir categorias que possuem produtos
                  associados. Para excluir, remova os produtos primeiro.
                </Text>
              </View>
            </View>
          </View>

          <View>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleUpdate}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (
                <>
                  <ActivityIndicator size='small' color='#ffffff' />
                  <Text style={styles.saveButtonText}>Salvando...</Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name='checkmark-outline'
                    size={16}
                    color='#ffffff'
                  />
                  <Text style={styles.saveButtonText}>Salvar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  inputGroup: {
    marginBottom: 20,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
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
    paddingTop: 20,
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
