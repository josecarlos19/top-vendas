import { useSQLiteContext } from "expo-sqlite";
import { ProductModelInterface, ProductSearchInterface, ProductStoreInterface, ProductUpdateInterface } from "@/interfaces/models/productInterface";
import { storeStockMovement, updateInitialStockMovement } from "../utils/stockMovementUtils";

export function useProductDatabase() {
  const database = useSQLiteContext();

  async function index(params?: ProductSearchInterface) {
    try {
      let query = `
        SELECT products.*, categories.name as category_name
        FROM products
        LEFT JOIN categories ON products.category_id = categories.id
        WHERE products.deleted_at IS NULL
      `;
      const queryParams: any[] = [];

      if (params?.q) {
        query += " AND (products.name LIKE ? OR products.barcode LIKE ? OR products.reference LIKE ?)";
        queryParams.push(`%${params.q}%`, `%${params.q}%`, `%${params.q}%`);
      }

      if (params?.category_id) {
        query += " AND products.category_id = ?";
        queryParams.push(params.category_id);
      }

      if (params?.active !== undefined) {
        query += " AND products.active = ?";
        queryParams.push(params.active);
      }

      if (params?.low_stock) {
        query += " AND products.initial_stock <= products.minimum_stock";
      }

      query += " ORDER BY products.name ASC";

      if (params?.page && params?.perPage) {
        const offset = (params.page - 1) * params.perPage;
        query += " LIMIT ? OFFSET ?";
        queryParams.push(params.perPage, offset);
      }

      const result = await database.getAllAsync(query, queryParams);
      return result as (ProductModelInterface & { name?: string })[];

    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Failed to fetch products");
    }
  }

  async function count(params?: Omit<ProductSearchInterface, 'page' | 'perPage'>) {
    try {
      let query = "SELECT COUNT(*) FROM products WHERE deleted_at IS NULL";
      const queryParams: any[] = [];

      if (params?.q) {
        query += " AND (name LIKE ? OR barcode LIKE ? OR reference LIKE ?)";
        queryParams.push(`%${params.q}%`, `%${params.q}%`, `%${params.q}%`);
      }

      if (params?.category_id) {
        query += " AND category_id = ?";
        queryParams.push(params.category_id);
      }

      if (params?.active !== undefined) {
        query += " AND active = ?";
        queryParams.push(params.active);
      }

      if (params?.low_stock) {
        query += " AND initial_stock <= minimum_stock";
      }

      const result = await database.getFirstAsync(query, queryParams) as { [key: string]: number };
      return Object.values(result)[0];

    } catch (error) {
      console.error("Error counting products:", error);
      throw new Error("Failed to count products");
    }
  }

  async function show(id: number) {
    try {
      const result = await database.getFirstAsync(
        `SELECT products.*, categories.name
         FROM products
         LEFT JOIN categories ON products.category_id = categories.id
         WHERE products.id = ? AND products.deleted_at IS NULL`,
        [id],
      );
      return result as (ProductModelInterface & { name?: string }) | null;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw new Error("Failed to fetch product");
    }
  }

  async function store(params: ProductStoreInterface) {
    const statement = await database.prepareAsync(
      `INSERT INTO products (
        name, barcode, reference, description, cost_price, sale_price,
        wholesale_price, initial_stock, minimum_stock, category_id, supplier
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    try {
      const result = await statement.executeAsync(
        params.name,
        params.barcode || null,
        params.reference || null,
        params.description || null,
        params.cost_price || null,
        params.sale_price,
        params.wholesale_price || null,
        params.initial_stock || 0,
        params.minimum_stock || 0,
        params.category_id || null,
        params.supplier || null,
      );
      const id = result.lastInsertRowId.toString();

      await storeStockMovement(database, {
        sale_id: null,
        product_id: parseInt(id, 10),
        type: "stock_in",
        quantity: params.initial_stock || 0,
        unit_value: params.sale_price || 0,
        total_value: (params.initial_stock || 0) * (params.sale_price || 0),
      });

      return {
        id,
        name: params.name,
        barcode: params.barcode,
        reference: params.reference,
        description: params.description,
        cost_price: params.cost_price,
        sale_price: params.sale_price,
        wholesale_price: params.wholesale_price,
        initial_stock: params.initial_stock,
        minimum_stock: params.minimum_stock,
        category_id: params.category_id,
        supplier: params.supplier,
      };
    } catch (error) {
      console.error("Error storing product:", error);
      throw new Error("Failed to store product");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function update(params: ProductUpdateInterface) {
    const statement = await database.prepareAsync(
      `UPDATE products SET
        name = ?, barcode = ?, reference = ?, description = ?, cost_price = ?,
        sale_price = ?, wholesale_price = ?, initial_stock = ?, minimum_stock = ?,
        category_id = ?, supplier = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL`,
    );
    try {
      await statement.executeAsync(
        params.name || "",
        params.barcode || null,
        params.reference || null,
        params.description || null,
        params.cost_price || null,
        params.sale_price || 0,
        params.wholesale_price || null,
        params.initial_stock || 0,
        params.minimum_stock || 0,
        params.category_id || null,
        params.supplier || null,
        params.id,
      );

      await updateInitialStockMovement(database, {
        product_id: params.id,
        quantity: params.initial_stock,
        unit_value: params.sale_price,
        total_value: (params.initial_stock || 0) * (params.sale_price || 0),
      })

      return await show(params.id);
    } catch (error) {
      console.error("Error updating product:", error);
      throw new Error("Failed to update product");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function remove(id: number) {
    const statement = await database.prepareAsync(
      "UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
    );
    try {
      await statement.executeAsync(id);
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw new Error("Failed to delete product");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function toggleActive(id: number) {
    try {
      const product = await show(id);
      if (!product) {
        throw new Error("Product not found");
      }

      const newActiveStatus = product.active === 1 ? 0 : 1;

      const statement = await database.prepareAsync(
        "UPDATE products SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      );

      try {
        await statement.executeAsync(newActiveStatus, id);
        return await show(id);
      } finally {
        await statement.finalizeAsync();
      }
    } catch (error) {
      console.error("Error toggling product status:", error);
      throw new Error("Failed to toggle product status");
    }
  }

  async function findByBarcode(barcode: string) {
    try {
      const result = await database.getFirstAsync(
        "SELECT * FROM products WHERE barcode = ? AND deleted_at IS NULL",
        [barcode],
      );
      return result as ProductModelInterface | null;
    } catch (error) {
      console.error("Error finding product by barcode:", error);
      throw new Error("Failed to find product by barcode");
    }
  }

  async function findByReference(reference: string) {
    try {
      const result = await database.getFirstAsync(
        "SELECT * FROM products WHERE reference = ? AND deleted_at IS NULL",
        [reference],
      );
      return result as ProductModelInterface | null;
    } catch (error) {
      console.error("Error finding product by reference:", error);
      throw new Error("Failed to find product by reference");
    }
  }

  async function updateStock(id: number, newStock: number) {
    const statement = await database.prepareAsync(
      "UPDATE products SET initial_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
    );
    try {
      await statement.executeAsync(newStock, id);
      return await show(id);
    } catch (error) {
      console.error("Error updating product stock:", error);
      throw new Error("Failed to update product stock");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function getLowStockProducts() {
    try {
      const result = await database.getAllAsync(
        `SELECT products.*, categories.name
         FROM products
         LEFT JOIN categories ON products.category_id = categories.id
         WHERE products.deleted_at IS NULL AND products.active = 1 AND products.initial_stock <= products.minimum_stock
         ORDER BY products.name ASC`,
      );
      return result as (ProductModelInterface & { name?: string })[];
    } catch (error) {
      console.error("Error fetching low stock products:", error);
      throw new Error("Failed to fetch low stock products");
    }
  }

  return {
    store,
    index,
    count,
    show,
    update,
    remove,
    toggleActive,
    findByBarcode,
    findByReference,
    updateStock,
    getLowStockProducts
  };
}
