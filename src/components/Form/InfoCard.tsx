import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type InfoCardVariant = 'info' | 'success' | 'warning' | 'error';

interface InfoCardProps {
  children: ReactNode;
  variant?: InfoCardVariant;
  icon?: keyof typeof Ionicons.glyphMap;
}

const variantStyles = {
  info: {
    background: '#eff6ff',
    border: '#bfdbfe',
    text: '#1e40af',
    iconColor: '#3b82f6',
  },
  success: {
    background: '#f0fdf4',
    border: '#86efac',
    text: '#166534',
    iconColor: '#22c55e',
  },
  warning: {
    background: '#fef3c7',
    border: '#fbbf24',
    text: '#92400e',
    iconColor: '#f59e0b',
  },
  error: {
    background: '#fee2e2',
    border: '#fca5a5',
    text: '#991b1b',
    iconColor: '#ef4444',
  },
};

export default function InfoCard({
  children,
  variant = 'info',
  icon = 'information-circle',
}: InfoCardProps) {
  const colors = variantStyles[variant];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.iconColor} />
      <Text style={[styles.text, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 12,
    alignItems: 'flex-start',
    borderWidth: 1.5,
    marginTop: 10,
    gap: 10,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
