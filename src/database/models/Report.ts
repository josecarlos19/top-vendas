import { useSQLiteContext } from 'expo-sqlite';

export function useReportDatabase() {
  const database = useSQLiteContext();

  async function index() {
    try {
      const productsResult = (await database.getFirstAsync(
        `
        SELECT COUNT(*) as count
        FROM products
        WHERE deleted_at IS NULL
        `
      )) as { count: number };

      const salesTodayResult = (await database.getFirstAsync(
        `
        SELECT COUNT(*) as count
        FROM sales
        WHERE DATE(sale_date, 'localtime') = DATE('now', 'localtime')
        AND status <> 'cancelled'
        AND deleted_at IS NULL
        `
      )) as { count: number };

      const customersResult = (await database.getFirstAsync(
        `
        SELECT COUNT(*) as count
        FROM customers
        WHERE deleted_at IS NULL
        `
      )) as { count: number };

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
          AND s.status <> 'completed'
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

  async function getLast7DaysSales() {
    try {
      const salesData = await database.getAllAsync<{
        date: string;
        total_sales: number;
      }>(
        `
        SELECT
          DATE(sale_date, 'localtime') as date,
          COUNT(*) as total_sales
        FROM sales
        WHERE DATE(sale_date, 'localtime') >= DATE('now', 'localtime', '-6 days')
          AND status <> 'cancelled'
          AND deleted_at IS NULL
        GROUP BY DATE(sale_date, 'localtime')
        ORDER BY date ASC
        `
      );

      const result: Array<{ date: string; totalSales: number }> = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const salesMap = new Map<string, number>();
      salesData.forEach(row => {
        salesMap.set(row.date, row.total_sales);
      });

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        result.push({
          date: dateStr,
          totalSales: salesMap.get(dateStr) || 0,
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching last 7 days sales:', error);
      throw new Error('Failed to fetch last 7 days sales');
    }
  }

  async function getActiveCustomers() {
    try {
      const customers = await database.getAllAsync<{
        id: number;
        name: string;
      }>(
        `
        SELECT id, name
        FROM customers
        WHERE active = 1 AND deleted_at IS NULL
        ORDER BY name ASC
        `
      );

      return customers;
    } catch (error) {
      console.error('Error fetching active customers:', error);
      throw new Error('Failed to fetch active customers');
    }
  }

  async function getSalesByCustomer(
    customerId: number,
    startDate: string,
    endDate: string
  ) {
    try {
      const sales = await database.getAllAsync<{
        id: number;
        customer_id: number;
        customer_name: string;
        subtotal: number;
        discount: number;
        total: number;
        payment_method: string;
        installments: number;
        status: string;
        sale_date: string;
        notes: string;
        items_count: number;
      }>(
        `
        SELECT
          s.id,
          s.customer_id,
          c.name as customer_name,
          s.subtotal,
          s.discount,
          s.total,
          s.payment_method,
          COALESCE((SELECT COUNT(*) FROM installments WHERE sale_id = s.id), 1) as installments,
          s.status,
          s.sale_date,
          s.notes,
          (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.customer_id = ?
          AND DATE(s.sale_date) BETWEEN DATE(?) AND DATE(?)
          AND s.deleted_at IS NULL
          AND s.status != 'cancelled'
        ORDER BY s.sale_date DESC, s.created_at DESC
        `,
        [customerId, startDate, endDate]
      );

      return sales;
    } catch (error) {
      console.error('Error fetching sales by customer:', error);
      throw new Error('Failed to fetch sales by customer');
    }
  }

  async function getSalesByPeriod(startDate: string, endDate: string) {
    try {
      const sales = await database.getAllAsync<{
        id: number;
        customer_id?: number;
        customer_name?: string;
        subtotal: number;
        discount: number;
        total: number;
        payment_method: string;
        installments: number;
        status: string;
        sale_date: string;
        items_count: number;
      }>(
        `
        SELECT
          s.id,
          s.customer_id,
          c.name as customer_name,
          s.subtotal,
          s.discount,
          s.total,
          s.payment_method,
          COALESCE((SELECT COUNT(*) FROM installments WHERE sale_id = s.id), 1) as installments,
          s.status,
          s.sale_date,
          (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE DATE(s.sale_date) BETWEEN DATE(?) AND DATE(?)
          AND s.deleted_at IS NULL
          AND s.status != 'cancelled'
        ORDER BY s.sale_date DESC, s.created_at DESC
        `,
        [startDate, endDate]
      );

      return sales;
    } catch (error) {
      console.error('Error fetching sales by period:', error);
      throw new Error('Failed to fetch sales by period');
    }
  }

  async function getTopProducts(startDate: string, endDate: string, limit: number = 5) {
    try {
      const products = await database.getAllAsync<{
        product_id: number;
        product_name: string;
        quantity: number;
      }>(
        `
        SELECT
          p.id as product_id,
          p.name as product_name,
          SUM(si.quantity) as quantity
        FROM sale_items si
        INNER JOIN products p ON si.product_id = p.id
        INNER JOIN sales s ON si.sale_id = s.id
        WHERE DATE(s.sale_date) BETWEEN DATE(?) AND DATE(?)
          AND s.status != 'cancelled'
          AND s.deleted_at IS NULL
        GROUP BY p.id, p.name
        ORDER BY quantity DESC
        LIMIT ?
        `,
        [startDate, endDate, limit]
      );

      return products;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw new Error('Failed to fetch top products');
    }
  }

  async function getTopCategories(startDate: string, endDate: string, limit: number = 5) {
    try {
      const categories = await database.getAllAsync<{
        category_id: number | null;
        category_name: string;
        quantity: number;
      }>(
        `
        SELECT
          COALESCE(c.id, 0) as category_id,
          COALESCE(c.name, 'Sem Categoria') as category_name,
          SUM(si.quantity) as quantity
        FROM sale_items si
        INNER JOIN products p ON si.product_id = p.id
        INNER JOIN sales s ON si.sale_id = s.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE DATE(s.sale_date) BETWEEN DATE(?) AND DATE(?)
          AND s.status != 'cancelled'
          AND s.deleted_at IS NULL
        GROUP BY category_id, category_name
        ORDER BY quantity DESC
        LIMIT ?
        `,
        [startDate, endDate, limit]
      );

      return categories;
    } catch (error) {
      console.error('Error fetching top categories:', error);
      throw new Error('Failed to fetch top categories');
    }
  }

  return {
    index,
    getLast7DaysSales,
    getActiveCustomers,
    getSalesByCustomer,
    getSalesByPeriod,
    getTopProducts,
    getTopCategories,
  };
}
