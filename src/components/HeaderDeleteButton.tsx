import React, { useLayoutEffect, useCallback, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import CustomDialog from '@/components/modals/CustomDialog';

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
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    message: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'primary' | 'danger' | 'success';
    }>;
  }>({
    title: '',
    message: '',
    icon: 'help-circle',
    iconColor: '#f59e0b',
    buttons: [],
  });

  const handleDelete = useCallback(() => {
    const message =
      confirmMessage ||
      `Deseja realmente excluir ${itemType} "${itemName}"? Esta ação não pode ser desfeita.`;

    setDialogConfig({
      title: confirmTitle,
      message,
      icon: 'help-circle',
      iconColor: '#f59e0b',
      buttons: [
        {
          text: 'Cancelar',
          onPress: () => setDialogVisible(false),
          style: 'default',
        },
        {
          text: 'Excluir',
          onPress: () => {
            setDialogVisible(false);
            confirmDelete();
          },
          style: 'danger',
        },
      ],
    });
    setDialogVisible(true);
  }, [itemName, itemType, confirmTitle, confirmMessage]);

  const confirmDelete = async () => {
    try {
      await onDelete();

      const message = successMessage || `${itemType} excluído com sucesso!`;
      setDialogConfig({
        title: 'Sucesso',
        message,
        icon: 'checkmark-circle',
        iconColor: '#22c55e',
        buttons: [
          {
            text: 'OK',
            onPress: () => setDialogVisible(false),
            style: 'primary',
          },
        ],
      });
      setDialogVisible(true);
    } catch (error) {
      console.error('Error deleting:', error);
      setDialogConfig({
        title: 'Erro',
        message: `Falha ao excluir ${itemType}`,
        icon: 'alert-circle',
        iconColor: '#ef4444',
        buttons: [
          {
            text: 'OK',
            onPress: () => setDialogVisible(false),
            style: 'primary',
          },
        ],
      });
      setDialogVisible(true);
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

  return (
    <CustomDialog
      visible={dialogVisible}
      title={dialogConfig.title}
      message={dialogConfig.message}
      icon={dialogConfig.icon}
      iconColor={dialogConfig.iconColor}
      buttons={dialogConfig.buttons}
      onClose={() => setDialogVisible(false)}
    />
  );
}
