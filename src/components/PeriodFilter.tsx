import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface PeriodFilterProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
}

export default function PeriodFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: PeriodFilterProps) {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Selecione';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.label}>Data Inicial</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#64748b" />
            <Text style={[styles.dateText, !startDate && styles.placeholderText]}>
              {formatDate(startDate)}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateField}>
          <Text style={styles.label}>Data Final</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndPicker(true)}
          >
            <Ionicons name="calendar-outline" size={20} color="#64748b" />
            <Text style={[styles.dateText, !endDate && styles.placeholderText]}>
              {formatDate(endDate)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) onStartDateChange(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) onEndDateChange(date);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dateField: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '400',
  },
});
