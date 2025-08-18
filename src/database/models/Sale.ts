import { useSQLiteContext } from 'expo-sqlite';
import {
  SaleStoreInterface,
  SaleModelInterface,
  SaleUpdateInterface,
  SaleSearchInterface,
} from '@/interfaces/models/saleInterface';
import { DateTime } from 'luxon';
import { destroyStockMovementsBySaleId } from '../utils/stockMovementUtils';

export function useSaleDatabase() {
  const database = useSQLiteContext();

  async function store(params: SaleStoreInterface) {
    return await database.withTransactionAsync(async () => {
      try {
        const saleStatement = await database.prepareAsync(
          `INSERT INTO sales (
            customer_id, subtotal, discount, total_amount,
            payment_method, installments, status, sale_date, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        const saleResult = await saleStatement.executeAsync(
          params.customer_id,
          params.subtotal,
          params.discount || 0,
          params.total,
          params.payment_method,
          params.installments || 1,
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
        }
      } catch (error) {
        console.error('Error storing sale:', error);
        throw new Error('Failed to store sale');
      }
    });
  }

  async function index(params?: SaleSearchInterface) {
    try {
      let query = `
        SELECT
          sales.*,
          customers.name as customer_name
        FROM sales
        LEFT JOIN customers ON sales.customer_id = customers.id
        WHERE sales.deleted_at IS NULL
      `;
      const queryParams: any[] = [];

      if (params?.q) {
        query += ` AND (
          sales.sale_number LIKE ? OR
          customers.name LIKE ? OR
          sales.notes LIKE ?
        )`;
        queryParams.push(`%${params.q}%`, `%${params.q}%`, `%${params.q}%`);
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
          sales.sale_number LIKE ? OR
          customers.name LIKE ? OR
          sales.notes LIKE ?
        )`;
        queryParams.push(`%${params.q}%`, `%${params.q}%`, `%${params.q}%`);
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

      if (!sale) return null;

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

      return {
        ...sale,
        items,
      };
    } catch (error) {
      console.error('Error fetching sale:', error);
      throw new Error('Failed to fetch sale');
    }
  }

  async function update(params: SaleUpdateInterface) {
    return await database.withTransactionAsync(async () => {
      try {
        const currentSale = (await database.getFirstAsync(
          'SELECT installments, sale_date FROM sales WHERE id = ? AND deleted_at IS NULL',
          [params.id]
        )) as { installments: number; sale_date: string } | null;

        if (!params.installments || params.installments <= 1) {
          const deleteInstallmentsStatement = await database.prepareAsync(
            "DELETE FROM installments WHERE sale_id = ? AND status = 'pending'"
          );
          await deleteInstallmentsStatement.executeAsync(params.id);
          await deleteInstallmentsStatement.finalizeAsync();
        } else if (currentSale && params.sale_date) {
          const oldSaleDate = new Date(currentSale.sale_date);
          const newSaleDate = params.sale_date;

          if (oldSaleDate.getTime() !== newSaleDate.getTime()) {
            const pendingInstallments = (await database.getAllAsync(
              "SELECT id, installment_number FROM installments WHERE sale_id = ? AND status = 'pending' ORDER BY installment_number",
              [params.id]
            )) as { id: number; installment_number: number }[];

            for (const installment of pendingInstallments) {
              const newDueDate = DateTime.fromJSDate(newSaleDate)
                .plus({ months: installment.installment_number })
                .toISODate();

              const updateInstallmentStatement = await database.prepareAsync(
                'UPDATE installments SET due_date = ? WHERE id = ?'
              );
              await updateInstallmentStatement.executeAsync(
                newDueDate,
                installment.id
              );
              await updateInstallmentStatement.finalizeAsync();
            }
          }
        }

        const deleteItemsStatement = await database.prepareAsync(
          'DELETE FROM sale_items WHERE sale_id = ?'
        );
        await deleteItemsStatement.executeAsync(params.id);
        await deleteItemsStatement.finalizeAsync();

        const deleteStockMovementsStatement = await database.prepareAsync(
          'UPDATE stock_movements SET deleted_at = CURRENT_TIMESTAMP WHERE sale_id = ?'
        );
        await deleteStockMovementsStatement.executeAsync(params.id);
        await deleteStockMovementsStatement.finalizeAsync();

        const saleStatement = await database.prepareAsync(
          `UPDATE sales SET
            customer_id = COALESCE(?, customer_id),
            subtotal = COALESCE(?, subtotal),
            discount = COALESCE(?, discount),
            total_amount = COALESCE(?, total_amount),
            payment_method = COALESCE(?, payment_method),
            installments = COALESCE(?, installments),
            status = COALESCE(?, status),
            sale_date = COALESCE(?, sale_date),
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND deleted_at IS NULL`
        );

        await saleStatement.executeAsync(
          params.customer_id || null,
          params.subtotal || null,
          params.discount || null,
          params.total || null,
          params.payment_method || null,
          params.installments || null,
          params.status || null,
          params.sale_date ? params.sale_date.toISOString() : null,
          params.notes || null,
          params.id
        );

        await saleStatement.finalizeAsync();

        if (params.itens && params.itens.length > 0) {
          const itemStatement = await database.prepareAsync(
            `INSERT INTO sale_items (
              sale_id, product_id, quantity, unit_price, subtotal
            ) VALUES (?, ?, ?, ?, ?)`
          );

          for (const item of params.itens) {
            await itemStatement.executeAsync(
              params.id,
              item.product_id,
              item.quantity,
              item.unit_price,
              item.subtotal
            );

            const stockStatement = await database.prepareAsync(
              `INSERT INTO stock_movements (
              sale_id, product_id, type, quantity, unit_value, total_value, notes
              ) VALUES (?, ?, 'sale', ?, ?, ?, 'Venda atualizada')`
            );
            await stockStatement.executeAsync(
              params.id,
              item.product_id,
              -item.quantity,
              item.unit_price,
              item.subtotal
            );
            await stockStatement.finalizeAsync();
          }

          await itemStatement.finalizeAsync();
        }
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

  return {
    index,
    count,
    show,
    store,
    update,
    remove,
  };
}
