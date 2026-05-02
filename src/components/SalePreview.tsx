import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface SalePreviewProps {
  sale: {
    customer_name?: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    sale_date: string;
    payment_method: string;
    installments?: number;
    paidInstallments?: number;
    totalInstallments?: number;
  };
  saleId: string;
}

const PAYMENT_METHOD_LABELS: { [key: string]: string } = {
  cash: 'Dinheiro',
  card: 'Cartão',
  pix: 'PIX',
  transfer: 'Transferência',
  installment: 'Parcelado',
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

const formatCurrencyFromNumber = (value: number): string => {
  // Valores vêm em centavos, precisam ser divididos por 100
  const valueInReais = value / 100;
  return valueInReais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

export default function SalePreview({ sale, saleId }: SalePreviewProps) {
  const router = useRouter();
  const viewShotRef = useRef<ViewShot>(null);

  const handleShareImage = async () => {
    try {
      if (!viewShotRef.current) {
        Alert.alert('Erro', 'Não foi possível capturar a imagem.');
        return;
      }

      // Capturar a view como imagem
      const uri = await viewShotRef.current.capture?.();

      if (!uri) {
        Alert.alert('Erro', 'Não foi possível gerar a imagem.');
        return;
      }

      // Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartilhar Comprovante',
        });
      } else {
        Alert.alert('Erro', 'Compartilhamento não está disponível neste dispositivo.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível compartilhar a imagem.');
      console.error('Erro ao compartilhar imagem:', error);
    }
  };

  const handleEditSale = () => {
    router.push(`/sales/${saleId}/edit`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ViewShot
          ref={viewShotRef}
          options={{
            format: 'png',
            quality: 1.0,
          }}
          style={styles.captureContainer}
        >
          <View style={styles.previewCard}>
            {/* Header compacto */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="receipt-outline" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.title}>Comprovante</Text>
            </View>

            {/* Cliente e Info em layout compacto */}
            <View style={styles.compactInfoSection}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={14} color="#64748b" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {sale.customer_name || 'Cliente não informado'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <Text style={styles.infoText}>{formatDate(sale.sale_date)}</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={14} color="#64748b" />
                <Text style={styles.infoText}>
                  {PAYMENT_METHOD_LABELS[sale.payment_method] || sale.payment_method}
                  {sale.payment_method === 'installment' && sale.totalInstallments && sale.totalInstallments > 0
                    ? ` - Parcelado: ${sale.paidInstallments || 0}/${sale.totalInstallments}`
                    : sale.installments && sale.installments > 1
                      ? ` (${sale.installments}x)`
                      : ''}
                </Text>
              </View>
            </View>

            {/* Lista de Produtos Compacta */}
            <View style={styles.productsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bag-outline" size={14} color="#3b82f6" />
                <Text style={styles.sectionTitle}>Produtos</Text>
              </View>

              <View style={styles.itemsList}>
                {sale.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.product_name}
                      </Text>
                      <Text style={styles.itemQuantity}>
                        {item.quantity}x {formatCurrencyFromNumber(item.unit_price)}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtotal}>
                      {formatCurrencyFromNumber(item.subtotal)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Totais Compactos */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>
                  {formatCurrencyFromNumber(sale.subtotal)}
                </Text>
              </View>

              {sale.discount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.discountLabel}>Desconto</Text>
                  <Text style={styles.discountValue}>
                    -{formatCurrencyFromNumber(sale.discount)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>
                  {formatCurrencyFromNumber(sale.total)}
                </Text>
              </View>
            </View>

            {/* Footer Compacto */}
            <View style={styles.footer}>
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text style={styles.footerText}>Venda realizada!</Text>
            </View>
          </View>
        </ViewShot>
      </ScrollView>

      {/* Botões de Ação */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEditSale}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil" size={18} color="#ffffff" />
          <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShareImage}
          activeOpacity={0.8}
        >
          <Ionicons name="camera" size={18} color="#ffffff" />
          <Text style={styles.actionButtonText}>Compartilhar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingBottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 80,
  },
  captureContainer: {
    backgroundColor: '#ffffff',
  },
  previewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  compactInfoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  productsSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginLeft: 6,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemLeft: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  totalsSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  discountLabel: {
    fontSize: 12,
    color: '#ec4899',
    fontWeight: '500',
  },
  discountValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ec4899',
  },
  divider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3b82f6',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 11,
    color: '#22c55e',
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.8)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#f59e0b',
  },
  shareButton: {
    backgroundColor: '#3b82f6',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
});
