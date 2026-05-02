import React from 'react';
import { View, Text, StyleSheet, TextInputProps } from 'react-native';
import { Input } from '@/components/Input';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
  containerStyle?: object;
}

export default function FormInput({
  label,
  error,
  required = false,
  containerStyle,
  ...inputProps
}: FormInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <Input {...inputProps} style={[styles.input, inputProps.style]} />
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
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1e293b',
  },
  error: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});
