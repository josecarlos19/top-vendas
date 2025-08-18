import { useSQLiteContext } from "expo-sqlite";
import { StockMovementInterface } from "@/interfaces/models/stockMovementInterface";

function validateStockMovementParams(params: Partial<StockMovementInterface>) {
  if (!params.product_id || !params.quantity || !params.unit_value) {
    throw new Error("Missing required parameters for updating stock movement");
  }

  if (params.quantity < 0 || params.unit_value < 0) {
    throw new Error("Quantity and unit value must be non-negative");
  }

  if (params.quantity === 0 && params.unit_value === 0) {
    throw new Error("At least one of quantity or unit value must be provided");
  }
}

export async function storeStockMovement(database: ReturnType<typeof useSQLiteContext>, params: StockMovementInterface) {
  const statement = await database.prepareAsync(
    `INSERT INTO stock_movements (
      sale_id, product_id, type, quantity, unit_value, total_value, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  try {
    validateStockMovementParams(params);

    await statement.executeAsync(
      params.sale_id,
      params.product_id,
      params.type,
      params.quantity,
      params.unit_value,
      params.total_value,
      params.notes || null
    );
  } catch (error) {
    console.error("Error storing stock movement:", error);
    throw new Error("Failed to store stock movement");
  } finally {
    await statement.finalizeAsync();
  }
}

export async function updateInitialStockMovement(
  database: ReturnType<typeof useSQLiteContext>,
  params: Partial<StockMovementInterface>
) {
  const statement = await database.prepareAsync(
    `UPDATE stock_movements SET quantity = ?, unit_value = ?, total_value = ? WHERE product_id = ? AND type = 'stock_in'`
  );
  try {
    validateStockMovementParams(params);

    await statement.executeAsync(
      params.quantity as number,
      params.unit_value as number,
      (params.quantity || 0) * (params.unit_value || 0),
      params.product_id as number
    );
  } catch (error) {
    console.error("Error updating initial stock movement:", error);
    throw new Error("Failed to update initial stock movement");
  } finally {
    await statement.finalizeAsync();
  }
}

export async function destroyStockMovementsBySaleId(
  database: ReturnType<typeof useSQLiteContext>,
  saleId: number
) {
  const statement = await database.prepareAsync(
    `DELETE FROM stock_movements WHERE sale_id = ?`
  );
  try {
    await statement.executeAsync(saleId);
  } catch (error) {
    console.error("Error deleting stock movements by sale ID:", error);
    throw new Error("Failed to delete stock movements");
  } finally {
    await statement.finalizeAsync();
  }
}
