import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FormSectionProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  iconColor?: string;
  children?: ReactNode;
  marginTop?: number;
}

export default function FormSection({
  icon,
  title,
  iconColor = '#FF6B35',
  children,
  marginTop = 16,
}: FormSectionProps) {
  return (
    <View style={[styles.container, { marginTop }]}>
      <View style={styles.header}>
        {icon && <Ionicons name={icon} size={20} color={iconColor} />}
        <Text style={styles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
});
