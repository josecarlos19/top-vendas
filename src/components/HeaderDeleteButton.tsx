import React, { useLayoutEffect, useCallback } from 'react';
import { TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

interface HeaderDeleteButtonProps {
  onDelete: () => Promise<void> | void;
  itemName: string;
  itemType?: string;
  confirmTitle?: string;
  confirmMessage?: string;
  successMessage?: string;
}

export function HeaderDeleteButton({
  onDelete,
  itemName,
  itemType = 'item',
  confirmTitle = 'Confirmar Exclusão',
  confirmMessage,
  successMessage,
}: HeaderDeleteButtonProps) {
  const navigation = useNavigation();

  const handleDelete = useCallback(() => {
    const message =
      confirmMessage ||
      `Deseja realmente excluir ${itemType} "${itemName}"? Esta ação não pode ser desfeita.`;

    Alert.alert(confirmTitle, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: confirmDelete,
      },
    ]);
  }, [itemName, itemType, confirmTitle, confirmMessage]);

  const confirmDelete = async () => {
    try {
      await onDelete();

      const message = successMessage || `${itemType} excluído com sucesso!`;
      Alert.alert('Sucesso', message);
    } catch (error) {
      console.error('Error deleting:', error);
      Alert.alert('Erro', `Falha ao excluir ${itemType}`);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleDelete}
          style={{ marginRight: 12 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name='trash-outline' size={22} color='#FF6A00' />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleDelete]);

  return null;
}
