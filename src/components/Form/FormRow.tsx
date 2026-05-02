import React from 'react';
import { View, StyleSheet } from 'react-native';

interface FormRowProps {
  children: React.ReactNode;
  gap?: number;
}

export default function FormRow({ children, gap = 12 }: FormRowProps) {
  return <View style={[styles.row, { gap }]}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
});
