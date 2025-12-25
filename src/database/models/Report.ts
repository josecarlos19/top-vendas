import { useSQLiteContext } from 'expo-sqlite';

export function useReportDatabase() {
  const database = useSQLiteContext();

  async function index() {
    try {
      /**
       * TOTAL DE PRODUTOS
       */
      const productsResult = (await database.getFirstAsync(
        `
        SELECT COUNT(*) as count
        FROM products
        WHERE deleted_at IS NULL
        `
      )) as { count: number };

      /**
       * VENDAS DO DIA
       */
      const salesTodayResult = (await database.getFirstAsync(
        `
        SELECT COUNT(*) as count
        FROM sales
        WHERE DATE(sale_date, 'localtime') = DATE('now', 'localtime')
        AND deleted_at IS NULL
        `
      )) as { count: number };

      /**
       * TOTAL DE CLIENTES
       */
      const customersResult = (await database.getFirstAsync(
        `
        SELECT COUNT(*) as count
        FROM customers
        WHERE deleted_at IS NULL
        `
      )) as { count: number };

      /**
       * RECEITA DO DIA
       */
      const revenueRows = await database.getAllAsync(
        `
        SELECT
          i.id            AS installment_id,
          i.sale_id       AS sale_id,
          i.number        AS installment_number,
          i.amount        AS amount,
          i.status        AS installment_status,
          i.payment_date  AS payment_date,
          s.payment_method,
          s.status        AS sale_status,
          s.sale_date
        FROM installments i
        INNER JOIN sales s ON s.id = i.sale_id
        WHERE
          DATE(i.payment_date, 'localtime') = DATE('now', 'localtime')
          AND i.status = 'completed'
          AND s.deleted_at IS NULL
        ORDER BY i.payment_date, i.sale_id, i.number
        `
      );

      let debugSum = 0;

      revenueRows.forEach((row: any) => {
        debugSum += row.amount;
      });

      const revenueToday = debugSum / 100;

      return {
        totalProducts: productsResult.count,
        salesToday: salesTodayResult.count,
        totalCustomers: customersResult.count,
        revenueToday,
      };
    } catch (error) {
      console.error('Error fetching report data:', error);
      throw new Error('Failed to fetch report data');
    }
  }

  return {
    index,
  };
}
