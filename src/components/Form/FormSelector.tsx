import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FormSelectorProps {
  label: string;
  value: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  error?: string;
  containerStyle?: object;
}

export default function FormSelector({
  label,
  value,
  onPress,
  icon = 'chevron-down',
  disabled = false,
  placeholder = 'Selecione...',
  required = false,
  error,
  containerStyle,
}: FormSelectorProps) {
  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[styles.selector, disabled && styles.disabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.text, isPlaceholder && styles.placeholder]}>
          {displayValue}
        </Text>
        <Ionicons
          name={icon}
          size={20}
          color={disabled ? '#cbd5e1' : '#64748b'}
        />
      </TouchableOpacity>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  selector: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  text: {
    fontSize: 15,
    color: '#1e293b',
    flex: 1,
  },
  placeholder: {
    color: '#94a3b8',
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
