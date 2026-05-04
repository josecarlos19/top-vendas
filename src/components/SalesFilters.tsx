import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import PeriodFilter from '@/components/PeriodFilter';
import MultipleStatusFilter from '@/components/MultipleStatusFilter';
import SearchableSelect from '@/components/SearchableSelect';

interface SalesFiltersProps {
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
  onPaymentMethodChange: (methods: string[]) => void;
  onCustomerChange: (customerId: number | null) => void;

  statusOptions: Array<{ label: string; value: string; color: string }>;
  paymentMethodOptions: Array<{ label: string; value: string; color: string }>;
  customers: Array<{ id: number; name: string }>;
}

export default function SalesFilters({
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
}: SalesFiltersProps) {
  const getInitialFilterType = (): 'sale' | 'due' | 'payment' => {
    if (dueDateStart || dueDateEnd) {
      return 'due';
    }
    if (paymentDateStart || paymentDateEnd) {
      return 'payment';
    }
    return 'sale';
  };

  const [dateFilterType, setDateFilterType] = useState<'sale' | 'due' | 'payment'>(getInitialFilterType());

  useEffect(() => {
    const newType = getInitialFilterType();
    if (newType !== dateFilterType) {
      setDateFilterType(newType);
    }
  }, [startDate, endDate, dueDateStart, dueDateEnd, paymentDateStart, paymentDateEnd]);

  const handleDateFilterTypeChange = (type: 'sale' | 'due' | 'payment') => {
    setDateFilterType(type);
    if (type === 'sale') {
      onDueDateStartChange(null);
      onDueDateEndChange(null);
      onPaymentDateStartChange(null);
      onPaymentDateEndChange(null);
    } else if (type === 'due') {
      onStartDateChange(null);
      onEndDateChange(null);
      onPaymentDateStartChange(null);
      onPaymentDateEndChange(null);
    } else {
      onStartDateChange(null);
      onEndDateChange(null);
      onDueDateStartChange(null);
      onDueDateEndChange(null);
    }
  };

  const getSafeDate = (date: Date | null): Date => {
    return date || new Date();
  };

  return (
    <View style={styles.container}>
      {/* Seletor de Tipo de Filtro de Data */}
      <View style={styles.dateTypeSelector}>
        <Text style={styles.dateTypeSelectorLabel}>Filtrar por:</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => handleDateFilterTypeChange('sale')}
          >
            <View style={styles.radioButton}>
              {dateFilterType === 'sale' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.radioLabel}>Período da Venda</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => handleDateFilterTypeChange('due')}
          >
            <View style={styles.radioButton}>
              {dateFilterType === 'due' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.radioLabel}>Data de Vencimento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => handleDateFilterTypeChange('payment')}
          >
            <View style={styles.radioButton}>
              {dateFilterType === 'payment' && <View style={styles.radioButtonInner} />}
            </View>
            <Text style={styles.radioLabel}>Data de Pagamento</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Período da Venda - mostrado apenas se selecionado */}
      {dateFilterType === 'sale' && (
        <>
          <Text style={styles.subLabel}>Período da Venda</Text>
          <PeriodFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={onStartDateChange}
            onEndDateChange={onEndDateChange}
          />
        </>
      )}

      {/* Data de Vencimento - mostrado apenas se selecionado */}
      {dateFilterType === 'due' && (
        <>
          <Text style={styles.subLabel}>Data de Vencimento</Text>
          <PeriodFilter
            startDate={dueDateStart}
            endDate={dueDateEnd}
            onStartDateChange={onDueDateStartChange}
            onEndDateChange={onDueDateEndChange}
          />
        </>
      )}

      {/* Data de Pagamento - mostrado apenas se selecionado */}
      {dateFilterType === 'payment' && (
        <>
          <Text style={styles.subLabel}>Data de Pagamento</Text>
          <PeriodFilter
            startDate={paymentDateStart}
            endDate={paymentDateEnd}
            onStartDateChange={onPaymentDateStartChange}
            onEndDateChange={onPaymentDateEndChange}
          />
        </>
      )}

      {/* Status */}
      <MultipleStatusFilter
        options={statusOptions}
        selectedValues={selectedStatus}
        onChange={onStatusChange}
        label="Status"
      />

      {/* Forma de Pagamento */}
      <MultipleStatusFilter
        options={paymentMethodOptions}
        selectedValues={selectedPaymentMethod}
        onChange={onPaymentMethodChange}
        label="Forma de Pagamento"
      />

      {/* Cliente */}
      <SearchableSelect
        label="Cliente"
        selectedValue={selectedCustomerId?.toString()}
        onValueChange={(value) => onCustomerChange(value ? Number(value) : null)}
        options={customers.map(c => ({ label: c.name, value: c.id.toString() }))}
        placeholder="Todos os clientes"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 16,
  },
  subLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
  },
  dateTypeSelector: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateTypeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
  },
});
