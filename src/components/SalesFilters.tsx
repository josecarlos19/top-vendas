import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  return (
    <View style={styles.container}>
      {/* Período da Venda */}
      <Text style={styles.subLabel}>Período da Venda</Text>
      <PeriodFilter
        startDate={startDate || new Date()}
        endDate={endDate || new Date()}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />

      {/* Data de Vencimento */}
      <Text style={styles.subLabel}>Data de Vencimento</Text>
      <PeriodFilter
        startDate={dueDateStart || new Date()}
        endDate={dueDateStart || new Date()}
        onStartDateChange={onDueDateStartChange}
        onEndDateChange={onDueDateEndChange}
      />

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

      {/* Data de Pagamento */}
      <Text style={styles.subLabel}>Data de Pagamento</Text>
      <PeriodFilter
        startDate={paymentDateStart || new Date()}
        endDate={paymentDateEnd || new Date()}
        onStartDateChange={onPaymentDateStartChange}
        onEndDateChange={onPaymentDateEndChange}
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
});
