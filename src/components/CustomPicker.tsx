import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface PickerOption {
  label: string;
  value: string | number;
}

interface CustomPickerProps {
  label: string;
  selectedValue: string | number | undefined;
  onValueChange: (value: string | number) => void;
  options: PickerOption[];
  enabled?: boolean;
  placeholder?: string;
  emptyOption?: boolean;
}

export default function CustomPicker({
  label,
  selectedValue,
  onValueChange,
  options,
  enabled = true,
  placeholder = 'Selecione...',
  emptyOption = true,
}: CustomPickerProps) {
  const [modifiedOptions, setModifiedOptions] =
    useState<PickerOption[]>(options);

  useEffect(() => {
    setModifiedOptions(
      emptyOption
        ? [{ label: `Sem ${label}`, value: 'null' }, ...options]
        : options
    );
  }, [options]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={itemValue => onValueChange(itemValue)}
          enabled={enabled}
          style={styles.picker}
          itemStyle={Platform.OS === 'ios' ? styles.pickerItemIOS : undefined}
        >
          {!selectedValue && (
            <Picker.Item
              label={placeholder}
              value=''
              enabled={false}
              style={styles.placeholderItem}
            />
          )}
          {modifiedOptions.map(option => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  pickerWrapper: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        paddingVertical: 0,
      },
      android: {
        paddingVertical: 0,
      },
    }),
  },
  picker: {
    ...Platform.select({
      ios: {
        height: 180,
      },
      android: {
        height: 50,
        color: '#1e293b',
      },
    }),
  },
  pickerItemIOS: {
    fontSize: 16,
    color: '#1e293b',
  },
  placeholderItem: {
    color: '#94a3b8',
  },
});
