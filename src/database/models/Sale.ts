import { useSQLiteContext } from 'expo-sqlite';
import {
  SaleStoreInterface,
  SaleModelInterface,
  SaleUpdateInterface,
  SaleSearchInterface,
} from '@/interfaces/models/saleInterface';
import { DateTime } from 'luxon';
import { destroyStockMovementsBySaleId } from '../utils/stockMovementUtils';
import { InstallmentItemInterface } from '@/interfaces/models/installmentInterface';

export function useSaleDatabase() {
  const database = useSQLiteContext();

  async function index(params?: SaleSearchInterface) {
    try {
      let query = `
        SELECT
          sales.*,
          customers.name as customer_name,
          (
            SELECT due_date
            FROM installments
            WHERE installments.sale_id = sales.id
            ORDER BY number ASC
            LIMIT 1
          ) as due_date
        FROM sales
        LEFT JOIN customers ON sales.customer_id = customers.id
        WHERE sales.deleted_at IS NULL
      `;
      const queryParams: any[] = [];

      if (params?.q) {
        query += ` AND (
          customers.name LIKE ? OR
          sales.notes LIKE ?
        )`;
        queryParams.push(`%${params.q}%`, `%${params.q}%`);
      }

      if (params?.startDate) {
        query += ` AND DATE(sales.sale_date) >= DATE(?)`;
        queryParams.push(params.startDate);
      }

      if (params?.endDate) {
        query += ` AND DATE(sales.sale_date) <= DATE(?)`;
        queryParams.push(params.endDate);
      }

      if (params?.dueDateStart) {
        query += ` AND (
          SELECT due_date
          FROM installments
          WHERE installments.sale_id = sales.id
          ORDER BY number ASC
          LIMIT 1
        ) >= DATE(?)`;
        queryParams.push(params.dueDateStart);
      }

      if (params?.dueDateEnd) {
        query += ` AND (
          SELECT due_date
          FROM installments
          WHERE installments.sale_id = sales.id
          ORDER BY number ASC
          LIMIT 1
        ) <= DATE(?)`;
        queryParams.push(params.dueDateEnd);
      }

      if (params?.status && params.status.length > 0) {
        const placeholders = params.status.map(() => '?').join(',');
        query += ` AND sales.status IN (${placeholders})`;
        queryParams.push(...params.status);
      } else {
        query += ` AND sales.status != 'cancelled'`;
      }

      if (params?.paymentMethod && params.paymentMethod.length > 0) {
        const placeholders = params.paymentMethod.map(() => '?').join(',');
        query += ` AND sales.payment_method IN (${placeholders})`;
        queryParams.push(...params.paymentMethod);
      }

      if (params?.customerId) {
        query += ` AND sales.customer_id = ?`;
        queryParams.push(params.customerId);
      }

      if (params?.paymentDateStart) {
        query += ` AND (
          SELECT payment_date
          FROM installments
          WHERE installments.sale_id = sales.id
          ORDER BY number ASC
          LIMIT 1
        ) >= DATE(?)`;
        queryParams.push(params.paymentDateStart);
      }

      if (params?.paymentDateEnd) {
        query += ` AND (
          SELECT payment_date
          FROM installments
          WHERE installments.sale_id = sales.id
          ORDER BY number ASC
          LIMIT 1
        ) <= DATE(?)`;
        queryParams.push(params.paymentDateEnd);
      }

      if (!params?.startDate && !params?.endDate && !params?.dueDateStart && !params?.dueDateEnd) {
        const today = DateTime.now().toISODate();
        const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toISODate();
        query += ` AND DATE(sales.sale_date) >= DATE(?)`;
        queryParams.push(thirtyDaysAgo);
        query += ` AND DATE(sales.sale_date) <= DATE(?)`;
        queryParams.push(today);
      }

      query += ' ORDER BY sales.sale_date DESC, sales.created_at DESC';

      if (params?.page && params?.perPage) {
        const offset = (params.page - 1) * params.perPage;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(params.perPage, offset);
      }

      const sales = await database.getAllAsync(query, queryParams);

      const salesWithItems = await Promise.all(
        sales.map(async (sale: any) => {
          const itemsQuery = `
            SELECT
              sale_items.*,
              products.name as product_name,
              products.barcode,
              products.initial_stock,
              COALESCE(
                (SELECT SUM(sm.quantity)
                 FROM stock_movements sm
                 WHERE sm.product_id = sale_items.product_id
                 AND sm.deleted_at IS NULL),
                0
              ) as current_stock
            FROM sale_items
            LEFT JOIN products ON sale_items.product_id = products.id
            WHERE sale_items.sale_id = ?
            ORDER BY sale_items.id
          `;

          const items = await database.getAllAsync(itemsQuery, [sale.id]);

          return {
            ...sale,
            items,
          };
        })
      );

      return salesWithItems as (SaleModelInterface & {
        customer_name?: string;
        items?: any[];
      })[];
    } catch (error) {
      console.error('Error fetching sales:', error);
      throw new Error('Failed to fetch sales');
    }
  }

  async function count(params?: Omit<SaleSearchInterface, 'page' | 'perPage'>) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM sales
        LEFT JOIN customers ON sales.customer_id = customers.id
        WHERE sales.deleted_at IS NULL
      `;
      const queryParams: any[] = [];

      if (params?.q) {
        query += ` AND (
          customers.name LIKE ? OR
          sales.notes LIKE ?
        )`;
        queryParams.push(`%${params.q}%`, `%${params.q}%`);
      }

      if (params?.startDate) {
        query += ` AND DATE(sales.sale_date) >= DATE(?)`;
        queryParams.push(params.startDate);
      }

      if (params?.endDate) {
        query += ` AND DATE(sales.sale_date) <= DATE(?)`;
        queryParams.push(params.endDate);
      }

      if (params?.dueDateStart) {
        query += ` AND (
          SELECT due_date
          FROM installments
          WHERE installments.sale_id = sales.id
          ORDER BY number ASC
          LIMIT 1
        ) >= DATE(?)`;
        queryParams.push(params.dueDateStart);
      }

      if (params?.dueDateEnd) {
        query += ` AND (
          SELECT due_date
          FROM installments
          WHERE installments.sale_id = sales.id
          ORDER BY number ASC
          LIMIT 1
        ) <= DATE(?)`;
        queryParams.push(params.dueDateEnd);
      }

      if (params?.status && params.status.length > 0) {
        const placeholders = params.status.map(() => '?').join(',');
        query += ` AND sales.status IN (${placeholders})`;
        queryParams.push(...params.status);
      } else {
        query += ` AND sales.status != 'cancelled'`;
      }

      if (params?.paymentMethod && params.paymentMethod.length > 0) {
        const placeholders = params.paymentMethod.map(() => '?').join(',');
        query += ` AND sales.payment_method IN (${placeholders})`;
        queryParams.push(...params.paymentMethod);
      }

      if (params?.customerId) {
        query += ` AND sales.customer_id = ?`;
        queryParams.push(params.customerId);
      }

      if (params?.paymentDateStart) {
        query += ` AND (
          SELECT payment_date
          FROM installments
          WHERE installments.sale_id = sales.id
          ORDER BY number ASC
          LIMIT 1
        ) >= DATE(?)`;
        queryParams.push(params.paymentDateStart);
      }

      if (params?.paymentDateEnd) {
        query += ` AND (
          SELECT payment_date
          FROM installments
          WHERE installments.sale_id = sales.id
          ORDER BY number ASC
          LIMIT 1
        ) <= DATE(?)`;
        queryParams.push(params.paymentDateEnd);
      }

      if (!params?.startDate && !params?.endDate && !params?.dueDateStart && !params?.dueDateEnd) {
        const today = DateTime.now().toISODate();
        const thirtyDaysAgo = DateTime.now().minus({ days: 30 }).toISODate();
        query += ` AND DATE(sales.sale_date) >= DATE(?)`;
        queryParams.push(thirtyDaysAgo);
        query += ` AND DATE(sales.sale_date) <= DATE(?)`;
        queryParams.push(today);
      }

      const result = (await database.getFirstAsync(query, queryParams)) as {
        count: number;
      };
      return result.count;
    } catch (error) {
      console.error('Error counting sales:', error);
      throw new Error('Failed to count sales');
    }
  }

  async function show(id: number) {
    try {
      const sale = (await database.getFirstAsync(
        `SELECT
          sales.*,
          customers.name as customer_name,
          customers.email as customer_email,
          customers.phone as customer_phone
        FROM sales
        LEFT JOIN customers ON sales.customer_id = customers.id
        WHERE sales.id = ? AND sales.deleted_at IS NULL`,
        [id]
      )) as
        | (SaleModelInterface & {
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
        })
        | null;

      if (!sale) {
        return null
      };

      const firstInstallment = (await database.getFirstAsync(
        `SELECT
          id,
          due_date,
          payment_date
        FROM installments
        WHERE sale_id = ?
        ORDER BY number ASC
        LIMIT 1`,
        [id]
      )) as
        | {
          id: number;
          due_date: string;
          payment_date?: string;
        }
        | null;

      const items = await database.getAllAsync(
        `SELECT
          sale_items.*,
          products.name as product_name,
          products.barcode,
          products.reference,
          products.initial_stock,
          COALESCE(
            (SELECT SUM(sm.quantity)
             FROM stock_movements sm
             WHERE sm.product_id = sale_items.product_id
             AND sm.deleted_at IS NULL
            ),
            0
          ) as current_stock
        FROM sale_items
        LEFT JOIN products ON sale_items.product_id = products.id
        WHERE sale_items.sale_id = ?
        ORDER BY sale_items.id`,
        [id]
      );

      const installments = await database.getAllAsync(
        `SELECT
          *
        FROM installments
        WHERE sale_id = ?
        ORDER BY number`,
        [id]
      );

      return {
        ...sale,
        first_installment_id: firstInstallment?.id,
        due_date: firstInstallment?.due_date,
        payment_date: firstInstallment?.payment_date,
        items,
        installments,
      };
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw new Error('Failed to fetch sale');
    }
  }

  async function store(params: SaleStoreInterface) {
    return await database.withTransactionAsync(async () => {
      try {
        const saleStatement = await database.prepareAsync(
          `INSERT INTO sales (
            customer_id,
            subtotal,
            discount,
            total,
            payment_method,
            status,
            sale_date,
            notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        );

        const saleResult = await saleStatement.executeAsync(
          params.customer_id,
          params.subtotal,
          params.discount || 0,
          params.total,
          params.payment_method,
          params.status || 'pending',
          params.sale_date
            ? params.sale_date.toISOString()
            : new Date().toISOString(),
          params.notes || null
        );

        await saleStatement.finalizeAsync();
        const saleId = saleResult.lastInsertRowId;

        if (params.itens && params.itens.length > 0) {
          const itemStatement = await database.prepareAsync(
            `INSERT INTO sale_items (
              sale_id, product_id, quantity, unit_price, subtotal
            ) VALUES (?, ?, ?, ?, ?)`
          );

          for (const item of params.itens) {
            await itemStatement.executeAsync(
              saleId,
              item.product_id,
              item.quantity,
              item.unit_price,
              item.subtotal
            );

            const stockStatement = await database.prepareAsync(
              `INSERT INTO stock_movements (
              sale_id, product_id, type, quantity, unit_value, total_value, notes
              ) VALUES (?, ?, 'sale', ?, ?, ?, 'Venda')`
            );
            await stockStatement.executeAsync(
              saleId,
              item.product_id,
              -item.quantity,
              item.unit_price,
              item.subtotal
            );
            await stockStatement.finalizeAsync();
          }
          await itemStatement.finalizeAsync();

          const installmentAmount = parseFloat(
            (params.total / params.installments).toFixed(2)
          );
          const installments: InstallmentItemInterface[] = [];
          const firstDueDate = DateTime.fromJSDate(params.first_due_date);

          for (let i = 0; i < params.installments; i++) {
            const dueDate = firstDueDate.plus({ months: i }).toISODate()!;
            installments.push({
              id: 0,
              sale_id: saleId,
              number: i + 1,
              amount: installmentAmount,
              due_date: i === 0 ? firstDueDate.toISODate()! : dueDate,
              status: 'pending',
            });
          }
          const installmentStatement = await database.prepareAsync(
            `INSERT INTO installments (
            sale_id, number, amount, due_date, status, payment_date, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`
          );

          for (let i = 0; i < installments.length; i++) {
            const installment = installments[i];
            const isFirstAndPaid = i === 0 && params.payment_date && params.status === 'completed';
            await installmentStatement.executeAsync(
              installment.sale_id,
              installment.number,
              installment.amount,
              installment.due_date,
              isFirstAndPaid ? 'completed' : installment.status || 'pending',
              isFirstAndPaid && params.payment_date ? params.payment_date.toISOString() : null,
              installment.notes || null
            );
          }

          await installmentStatement.finalizeAsync();
        }
      } catch (error) {
        console.error('Error storing sale:', error);
        throw new Error('Failed to store sale');
      }
    });
  }

  async function update(params: SaleUpdateInterface) {
    return await database.withTransactionAsync(async () => {
      try {
        const saleStatement = await database.prepareAsync(
          `UPDATE sales SET
            status = COALESCE(?, status),
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND deleted_at IS NULL`
        );

        await saleStatement.executeAsync(
          params.status || null,
          params.notes || null,
          params.id
        );

        if (params.status === 'completed') {
          const updateInstallmentsStatement = await database.prepareAsync(
            `UPDATE installments SET
              payment_date = CURRENT_DATE,
              status = 'completed',
              updated_at = CURRENT_TIMESTAMP
            WHERE sale_id = ? AND status = 'pending'`
          );
          await updateInstallmentsStatement.executeAsync(params.id);
          await updateInstallmentsStatement.finalizeAsync();
        }

        if (params.status === 'pending') {
          const updateInstallmentsStatement = await database.prepareAsync(
            `UPDATE installments SET
              payment_date = NULL,
              status = 'pending',
              updated_at = CURRENT_TIMESTAMP
            WHERE sale_id = ? AND status = 'completed'`
          );
          await updateInstallmentsStatement.executeAsync(params.id);
          await updateInstallmentsStatement.finalizeAsync();
        }

        if (params.status === 'cancelled') {
          await destroyStockMovementsBySaleId(database, params.id);
          const updateInstallmentsStatement = await database.prepareAsync(
            `UPDATE installments SET
              status = 'cancelled',
              updated_at = CURRENT_TIMESTAMP
            WHERE sale_id = ? AND status = 'pending'`
          );
          await updateInstallmentsStatement.executeAsync(params.id);
          await updateInstallmentsStatement.finalizeAsync();
        }

        await saleStatement.finalizeAsync();
      } catch (error) {
        console.error('Error updating sale:', error);
        throw new Error('Failed to update sale');
      }
    });
  }

  async function remove(id: number) {
    return await database.withTransactionAsync(async () => {
      try {
        await destroyStockMovementsBySaleId(database, id);

        const statement = await database.prepareAsync(
          'UPDATE sales SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?'
        );

        await statement.executeAsync(id);
        await statement.finalizeAsync();
      } catch (error) {
        console.error('Error deleting sale:', error);
        throw new Error('Failed to delete sale');
      }
    });
  }

  async function updateStatus(id: number, status: 'pending' | 'completed' | 'cancelled') {
    return await update({ id, status });
  }

  async function getStatus(id: number) {
    try {
      const result = await database.getFirstAsync<{ status: string }>(
        'SELECT status FROM sales WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      return result?.status || null;
    } catch (error) {
      console.error('Error fetching sale status:', error);
      throw new Error('Failed to fetch sale status');
    }
  }

  return {
    index,
    count,
    show,
    store,
    update,
    updateStatus,
    getStatus,
    remove,
  };
}
