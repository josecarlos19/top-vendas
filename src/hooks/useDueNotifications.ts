import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateTime } from 'luxon';

export interface DueSaleNotification {
  id: number;
  customer_id?: number;
  customer_name?: string;
  total?: number;
  due_date: string;
  payment_method?: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export interface DueNotificationsResult {
  overdueSales: DueSaleNotification[];
  upcomingSales: DueSaleNotification[];
  totalCount: number;
  shouldShow: boolean;
}

const STORAGE_KEY = '@due_notifications_dismissed';

export function useDueNotifications() {
  const database = useSQLiteContext();
  const [notifications, setNotifications] = useState<DueNotificationsResult>({
    overdueSales: [],
    upcomingSales: [],
    totalCount: 0,
    shouldShow: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkDueNotifications();
  }, []);

  async function checkDueNotifications(): Promise<DueNotificationsResult> {
    try {
      setIsLoading(true);

      const today = DateTime.now().toISODate();
      const sevenDaysFromNow = DateTime.now().plus({ days: 7 }).toISODate();

      // Busca vendas pendentes com vencimento nos próximos 7 dias ou já vencidas
      const query = `
        SELECT
          sales.id,
          sales.customer_id,
          sales.total,
          sales.payment_method,
          customers.name as customer_name,
          (
            SELECT due_date
            FROM installments
            WHERE sale_id = sales.id
              AND status = 'pending'
            ORDER BY due_date ASC
            LIMIT 1
          ) as due_date
        FROM sales
        LEFT JOIN customers ON sales.customer_id = customers.id
        WHERE sales.status = 'pending'
          AND sales.deleted_at IS NULL
          AND EXISTS (
            SELECT 1
            FROM installments
            WHERE sale_id = sales.id
              AND status = 'pending'
              AND due_date IS NOT NULL
              AND due_date <= DATE(?)
          )
        ORDER BY (
          SELECT due_date
          FROM installments
          WHERE sale_id = sales.id
            AND status = 'pending'
          ORDER BY due_date ASC
          LIMIT 1
        ) ASC
      `;

      const results = await database.getAllAsync(query, [sevenDaysFromNow]) as any[];

      // Verifica quais notificações já foram dispensadas hoje
      const dismissedToday = await getDismissedToday();

      // Processa os resultados
      const overdueSales: DueSaleNotification[] = [];
      const upcomingSales: DueSaleNotification[] = [];

      for (const sale of results) {
        if (!sale.due_date) continue;

        const dueDate = DateTime.fromISO(sale.due_date);
        const now = DateTime.now().startOf('day');
        const daysUntilDue = Math.floor(dueDate.diff(now, 'days').days);

        const notification: DueSaleNotification = {
          id: sale.id,
          customer_id: sale.customer_id,
          customer_name: sale.customer_name || 'Cliente sem nome',
          total: sale.total,
          due_date: sale.due_date,
          payment_method: sale.payment_method,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
        };

        // Só adiciona se não foi dispensada hoje
        if (!dismissedToday.includes(sale.id)) {
          if (daysUntilDue < 0) {
            overdueSales.push(notification);
          } else {
            upcomingSales.push(notification);
          }
        }
      }

      const result: DueNotificationsResult = {
        overdueSales,
        upcomingSales,
        totalCount: overdueSales.length + upcomingSales.length,
        shouldShow: overdueSales.length > 0 || upcomingSales.length > 0,
      };

      setNotifications(result);
      return result;
    } catch (error) {
      console.error('Error checking due notifications:', error);
      const emptyResult = {
        overdueSales: [],
        upcomingSales: [],
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
      const today = DateTime.now().toISODate();
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

  async function dismissNotification(saleId: number): Promise<void> {
    try {
      const today = DateTime.now().toISODate();
      const dismissed = await getDismissedToday();

      const updated = {
        date: today,
        dismissedIds: [...dismissed, saleId],
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Atualiza o estado local
      setNotifications(prev => ({
        overdueSales: prev.overdueSales.filter(s => s.id !== saleId),
        upcomingSales: prev.upcomingSales.filter(s => s.id !== saleId),
        totalCount: prev.totalCount - 1,
        shouldShow: prev.totalCount - 1 > 0,
      }));
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }

  async function dismissAll(): Promise<void> {
    try {
      const today = DateTime.now().toISODate();
      const allIds = [
        ...notifications.overdueSales.map(s => s.id),
        ...notifications.upcomingSales.map(s => s.id),
      ];

      const updated = {
        date: today,
        dismissedIds: allIds,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

      // Limpa o estado local
      setNotifications({
        overdueSales: [],
        upcomingSales: [],
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
    checkDueNotifications,
    dismissNotification,
    dismissAll,
  };
}
