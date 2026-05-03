import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SalesFilters from '@/components/SalesFilters';

interface SalesPeriodFilterProps {
  visible: boolean;
  onToggle: () => void;
  startDate: Date | null;
  endDate: Date | null;
  dueDateStart: Date | null;
  dueDateEnd: Date | null;
  paymentDateStart: Date | null;
  paymentDateEnd: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  onDueDateStartChange: (date: Date | null) => void;
  onDueDateEndChange: (date: Date | null) => void;
  onPaymentDateStartChange: (date: Date | null) => void;
  onPaymentDateEndChange: (date: Date | null) => void;
  selectedStatus: string[];
  selectedPaymentMethod: string[];
  selectedCustomerId: number | null;
  onStatusChange: (status: string[]) => void;
  onPaymentMethodChange: (method: string[]) => void;
  onCustomerChange: (id: number | null) => void;
  statusOptions: Array<{ label: string; value: string; color: string }>;
  paymentMethodOptions: Array<{ label: string; value: string; color: string }>;
  customers: Array<{ id: number; name: string }>;
  onClear: () => void;
  onApply: () => void;
  isLoading?: boolean;
  hasActiveFilters: boolean;
}

export default function SalesPeriodFilter({
  visible,
  onToggle,
  startDate,
  endDate,
  dueDateStart,
  dueDateEnd,
  paymentDateStart,
  paymentDateEnd,
  onStartDateChange,
  onEndDateChange,
  onDueDateStartChange,
  onDueDateEndChange,
  onPaymentDateStartChange,
  onPaymentDateEndChange,
  selectedStatus,
  selectedPaymentMethod,
  selectedCustomerId,
  onStatusChange,
  onPaymentMethodChange,
  onCustomerChange,
  statusOptions,
  paymentMethodOptions,
  customers,
  onClear,
  onApply,
  isLoading = false,
  hasActiveFilters,
}: SalesPeriodFilterProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [visible]);

  const maxHeight = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500],
  });

  const opacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <>
      <View style={styles.filterSection}>
        {/* Botão para mostrar/ocultar filtro de data */}
        <TouchableOpacity style={styles.filterToggleButton} onPress={onToggle}>
          <Ionicons
            name={visible ? 'chevron-up' : 'chevron-down'}
            size={20}
            color='#64748b'
          />
          <Text style={styles.filterToggleText}>Filtrar por período</Text>
          {hasActiveFilters && (
            <View style={styles.filterActiveBadge}>
              <Ionicons name='checkmark-circle' size={16} color='#22c55e' />
            </View>
          )}
        </TouchableOpacity>

        {/* Filtros - mostrado condicionalmente */}
        {visible && (
          <Animated.View style={[styles.periodFilterContainer, { maxHeight, opacity, overflow: 'hidden' }]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <SalesFilters
                startDate={startDate}
                endDate={endDate}
                dueDateStart={dueDateStart}
                dueDateEnd={dueDateEnd}
                paymentDateStart={paymentDateStart}
                paymentDateEnd={paymentDateEnd}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
                onDueDateStartChange={onDueDateStartChange}
                onDueDateEndChange={onDueDateEndChange}
                onPaymentDateStartChange={onPaymentDateStartChange}
                onPaymentDateEndChange={onPaymentDateEndChange}
                selectedStatus={selectedStatus}
                selectedPaymentMethod={selectedPaymentMethod}
                selectedCustomerId={selectedCustomerId}
                onStatusChange={onStatusChange}
                onPaymentMethodChange={onPaymentMethodChange}
                onCustomerChange={onCustomerChange}
                statusOptions={statusOptions}
                paymentMethodOptions={paymentMethodOptions}
                customers={customers}
              />
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={onClear}
                disabled={!hasActiveFilters}
              >
                <Ionicons
                  name='close-circle-outline'
                  size={16}
                  color={!hasActiveFilters ? '#cbd5e1' : '#64748b'}
                />
                <Text
                  style={[
                    styles.clearFilterButtonText,
                    !hasActiveFilters && styles.disabledText,
                  ]}
                >
                  Limpar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={onApply}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color='#ffffff' size='small' />
                ) : (
                  <>
                    <Ionicons name='search' size={16} color='#ffffff' />
                    <Text style={styles.applyFilterButtonText}>Buscar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: '#f8fafc',
  },
  filterToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  filterActiveBadge: {
    marginLeft: 8,
  },
  periodFilterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    maxHeight: 400,
    backgroundColor: '#ffffff',

  },
  scrollViewContent: {
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  clearFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clearFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  disabledText: {
    color: '#ffffff',
  },
  applyFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  applyFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
