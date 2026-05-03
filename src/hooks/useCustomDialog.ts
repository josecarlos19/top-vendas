import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface DialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'primary' | 'danger' | 'success';
}

interface DialogConfig {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons: DialogButton[];
}

export function useCustomDialog() {
  const [config, setConfig] = useState<DialogConfig>({
    visible: false,
    title: '',
    message: '',
    icon: 'information-circle',
    iconColor: '#3b82f6',
    buttons: [],
  });

  const showDialog = ({
    title,
    message,
    icon = 'information-circle',
    iconColor = '#3b82f6',
    buttons = [],
  }: Omit<DialogConfig, 'visible'>) => {
    setConfig({
      visible: true,
      title,
      message,
      icon,
      iconColor,
      buttons,
    });
  };

  const hideDialog = () => {
    setConfig(prev => ({ ...prev, visible: false }));
  };

  const showAlert = (title: string, message: string, onPress?: () => void) => {
    showDialog({
      title,
      message,
      icon: 'information-circle',
      iconColor: '#3b82f6',
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => { }),
          style: 'primary',
        },
      ],
    });
  };

  const showError = (title: string, message: string, onPress?: () => void) => {
    showDialog({
      title,
      message,
      icon: 'alert-circle',
      iconColor: '#ef4444',
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => { }),
          style: 'danger',
        },
      ],
    });
  };

  const showSuccess = (title: string, message: string, onPress?: () => void) => {
    showDialog({
      title,
      message,
      icon: 'checkmark-circle',
      iconColor: '#22c55e',
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => { }),
          style: 'success',
        },
      ],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar'
  ) => {
    showDialog({
      title,
      message,
      icon: 'help-circle',
      iconColor: '#f59e0b',
      buttons: [
        {
          text: cancelText,
          onPress: onCancel || (() => { }),
          style: 'default',
        },
        {
          text: confirmText,
          onPress: onConfirm,
          style: 'primary',
        },
      ],
    });
  };

  const showDestructive = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    confirmText: string = 'Excluir',
    cancelText: string = 'Cancelar'
  ) => {
    showDialog({
      title,
      message,
      icon: 'warning',
      iconColor: '#ef4444',
      buttons: [
        {
          text: cancelText,
          onPress: onCancel || (() => { }),
          style: 'default',
        },
        {
          text: confirmText,
          onPress: onConfirm,
          style: 'danger',
        },
      ],
    });
  };

  return {
    config,
    showDialog,
    hideDialog,
    showAlert,
    showError,
    showSuccess,
    showConfirm,
    showDestructive,
  };
}
