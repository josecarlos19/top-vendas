import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LowStockProduct {
  id: number;
  name: string;
  barcode?: string;
  reference?: string;
  current_stock: number;
  minimum_stock: number;
  category_name?: string;
  sale_price?: number;
  stockDifference: number;
  stockPercentage: number;
  isCritical: boolean;
}

export interface LowStockNotificationsResult {
  criticalProducts: LowStockProduct[];
  lowStockProducts: LowStockProduct[];
  totalCount: number;
  shouldShow: boolean;
}

const STORAGE_KEY = '@low_stock_notifications_dismissed';

export function useLowStockNotifications() {
  const database = useSQLiteContext();
  const [notifications, setNotifications] = useState<LowStockNotificationsResult>({
    criticalProducts: [],
    lowStockProducts: [],
    totalCount: 0,
    shouldShow: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkLowStockNotifications();
  }, []);

  async function checkLowStockNotifications(): Promise<LowStockNotificationsResult> {
    try {
      setIsLoading(true);

      // Busca produtos com estoque atual abaixo ou igual ao mínimo
      const query = `
        SELECT
          products.id,
          products.name,
          products.barcode,
          products.reference,
          products.minimum_stock,
          products.sale_price,
          categories.name as category_name,
          COALESCE(
            (SELECT SUM(sm.quantity)
             FROM stock_movements sm
             WHERE sm.product_id = products.id
             AND sm.deleted_at IS NULL),
            0
          ) as current_stock
        FROM products
        LEFT JOIN categories ON products.category_id = categories.id
        WHERE products.deleted_at IS NULL
          AND products.active = 1
          AND products.minimum_stock > 0
          AND COALESCE(
            (SELECT SUM(sm.quantity)
             FROM stock_movements sm
             WHERE sm.product_id = products.id
             AND sm.deleted_at IS NULL),
            0
          ) <= products.minimum_stock
        ORDER BY
          CASE
            WHEN COALESCE(
              (SELECT SUM(sm.quantity)
               FROM stock_movements sm
               WHERE sm.product_id = products.id
               AND sm.deleted_at IS NULL),
              0
            ) = 0 THEN 0
            ELSE 1
          END ASC,
          COALESCE(
            (SELECT SUM(sm.quantity)
             FROM stock_movements sm
             WHERE sm.product_id = products.id
             AND sm.deleted_at IS NULL),
            0
          ) ASC
      `;

      const results = await database.getAllAsync(query) as any[];

      // Verifica quais notificações já foram dispensadas hoje
      const dismissedToday = await getDismissedToday();

      // Processa os resultados
      const criticalProducts: LowStockProduct[] = [];
      const lowStockProducts: LowStockProduct[] = [];

      for (const product of results) {
        const currentStock = product.current_stock || 0;
        const minimumStock = product.minimum_stock || 0;
        const stockDifference = currentStock - minimumStock;
        const stockPercentage = minimumStock > 0
          ? Math.round((currentStock / minimumStock) * 100)
          : 0;
        const isCritical = currentStock === 0 || stockPercentage <= 25;

        const notification: LowStockProduct = {
          id: product.id,
          name: product.name,
          barcode: product.barcode,
          reference: product.reference,
          current_stock: currentStock,
          minimum_stock: minimumStock,
          category_name: product.category_name,
          sale_price: product.sale_price,
          stockDifference,
          stockPercentage,
          isCritical,
        };

        // Só adiciona se não foi dispensada hoje
        if (!dismissedToday.includes(product.id)) {
          if (isCritical) {
            criticalProducts.push(notification);
          } else {
            lowStockProducts.push(notification);
          }
        }
      }

      const result: LowStockNotificationsResult = {
        criticalProducts,
        lowStockProducts,
        totalCount: criticalProducts.length + lowStockProducts.length,
        shouldShow: criticalProducts.length > 0 || lowStockProducts.length > 0,
      };

      setNotifications(result);
      return result;
    } catch (error) {
      console.error('Error checking low stock notifications:', error);
      const emptyResult = {
        criticalProducts: [],
        lowStockProducts: [],
        totalCount: 0,
        shouldShow: false,
      };
      setNotifications(emptyResult);
      return emptyResult;
    } finally {
      setIsLoading(false);
    }
  }

  async function getDismissedToday(): Promise<number[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (!stored) return [];

      const data = JSON.parse(stored);

      // Se a data armazenada não é hoje, limpa os dados
      if (data.date !== today) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return [];
      }

      return data.dismissedIds || [];
    } catch (error) {
      console.error('Error getting dismissed notifications:', error);
      return [];
    }
  }

  async function dismissNotification(productId: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dismissed = await getDismissedToday();

      const updated = {
        date: today,
        dismissedIds: [...dismissed, productId],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Atualiza o estado local
      setNotifications(prev => ({
        criticalProducts: prev.criticalProducts.filter(p => p.id !== productId),
        lowStockProducts: prev.lowStockProducts.filter(p => p.id !== productId),
        totalCount: prev.totalCount - 1,
        shouldShow: prev.totalCount - 1 > 0,
      }));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  async function dismissAll(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const allIds = [
        ...notifications.criticalProducts.map(p => p.id),
        ...notifications.lowStockProducts.map(p => p.id),
      ];

      const updated = {
        date: today,
        dismissedIds: allIds,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Limpa o estado local
      setNotifications({
        criticalProducts: [],
        lowStockProducts: [],
        totalCount: 0,
        shouldShow: false,
      });
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  }

  return {
    notifications,
    isLoading,
    checkLowStockNotifications,
    dismissNotification,
    dismissAll,
  };
}
