import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDueNotifications, DueSaleNotification } from '@/hooks/useDueNotifications';
import { router } from 'expo-router';
import { DateTime } from 'luxon';

export default function DueNotifications() {
  const { notifications, isLoading, dismissNotification, dismissAll } = useDueNotifications();

  const handleViewDetails = (saleId: number) => {
    router.push(`/sales/${saleId}/edit`);
    dismissNotification(saleId);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDaysText = (days: number) => {
    if (days < 0) {
      const absDays = Math.abs(days);
      return absDays === 1 ? '1 dia de atraso' : `${absDays} dias de atraso`;
    }
    if (days === 0) return 'Vence hoje';
    return days === 1 ? 'Vence amanhã' : `Vence em ${days} dias`;
  };

  const formatDate = (dateStr: string) => {
    return DateTime.fromISO(dateStr).toFormat('dd/MM/yyyy');
  };

  const renderSaleItem = (sale: DueSaleNotification, isOverdue: boolean) => (
    <View key={sale.id} style={[styles.saleItem, isOverdue && styles.overdueSaleItem]}>
      <View style={styles.saleHeader}>
        <View style={styles.saleHeaderLeft}>
          <Ionicons
            name={isOverdue ? 'alert-circle' : 'time-outline'}
            size={20}
            color={isOverdue ? '#ef4444' : '#f59e0b'}
          />
          <Text style={styles.customerName} numberOfLines={1}>
            {sale.customer_name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => dismissNotification(sale.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle-outline" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.saleInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Valor:</Text>
          <Text style={styles.value}>{formatCurrency(sale.total || 0)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Vencimento:</Text>
          <Text style={styles.value}>{formatDate(sale.due_date)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Status:</Text>
          <Text style={[styles.statusText, isOverdue && styles.overdueText]}>
            {formatDaysText(sale.daysUntilDue)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.detailsButton, isOverdue && styles.overdueDetailsButton]}
        onPress={() => handleViewDetails(sale.id)}
      >
        <Text style={[styles.detailsButtonText, isOverdue && styles.overdueDetailsButtonText]}>
          Ver detalhes
        </Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={isOverdue ? '#ef4444' : '#f59e0b'}
        />
      </TouchableOpacity>
    </View>
  );

  if (isLoading || !notifications.shouldShow) {
    return null;
  }

  return (
    <Modal
      visible={notifications.shouldShow}
      transparent
      animationType="fade"
      onRequestClose={dismissAll}
    >
      <Pressable style={styles.overlay} onPress={dismissAll}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="notifications" size={24} color="#667eea" />
              <Text style={styles.title}>Notificações de Vencimento</Text>
            </View>
            <TouchableOpacity onPress={dismissAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.overdueSales.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  <Text style={styles.sectionTitle}>
                    🔴 Vencidas ({notifications.overdueSales.length})
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Vendas que já passaram da data de vencimento
                </Text>
                {notifications.overdueSales.map(sale => renderSaleItem(sale, true))}
              </View>
            )}

            {notifications.upcomingSales.length > 0 && (
              <View style={[styles.section, notifications.overdueSales.length > 0 && styles.sectionSpacing]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time-outline" size={20} color="#f59e0b" />
                  <Text style={styles.sectionTitle}>
                    🟡 Próximas ({notifications.upcomingSales.length})
                  </Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Vendas com vencimento nos próximos 7 dias
                </Text>
                {notifications.upcomingSales.map(sale => renderSaleItem(sale, false))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.dismissAllButton} onPress={dismissAll}>
              <Text style={styles.dismissAllButtonText}>Dispensar Tudo</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 8,
  },
  sectionSpacing: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  saleItem: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  overdueSaleItem: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  saleInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  overdueText: {
    color: '#ef4444',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  overdueDetailsButton: {
    borderColor: '#fecaca',
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  overdueDetailsButtonText: {
    color: '#ef4444',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  dismissAllButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dismissAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
