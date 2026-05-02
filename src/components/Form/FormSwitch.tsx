import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FormSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  description?: string;
  containerStyle?: object;
}

export default function FormSwitch({
  label,
  value,
  onValueChange,
  icon,
  disabled = false,
  description,
  containerStyle,
}: FormSwitchProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.content}>
        <View style={styles.labelContainer}>
          {icon && <Ionicons name={icon} size={20} color="#64748b" />}
          <View style={styles.textContainer}>
            <Text style={styles.label}>{label}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: '#e2e8f0', true: '#86efac' }}
          thumbColor={value ? '#22c55e' : '#f8fafc'}
          ios_backgroundColor="#e2e8f0"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  description: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
