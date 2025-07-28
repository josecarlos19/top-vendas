import { useSQLiteContext } from "expo-sqlite";
import { CategoryModelInterface, CategorySearchInterface, CategoryStoreInterface, CategoryUpdateInterface } from "@/interfaces/models/categoryInterface";

export function useCategoryDatabase() {
  const database = useSQLiteContext();

  async function store(params: CategoryStoreInterface) {
    const statement = await database.prepareAsync(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
    );
    try {
      const result = await statement.executeAsync(
        params.name,
        params.description || null,
      );
      const id = result.lastInsertRowId.toString();
      return {
        id,
        name: params.name,
        description: params.description,
      };
    } catch (error) {
      console.error("Error storing category:", error);
      throw new Error("Failed to store category");
    } finally {
      await statement.finalizeAsync();
    }
  }

async function index(params?: CategorySearchInterface) {
  try {
    let query = "SELECT * FROM categories WHERE deleted_at IS NULL";
    const queryParams: any[] = [];


    if (params?.name) {
      query += " AND name LIKE ?";
      queryParams.push(`%${params.name}%`);
    }

    if (params?.description) {
      query += " AND description LIKE ?";
      queryParams.push(`%${params.description}%`);
    }

    if (params?.active !== undefined) {
      query += " AND active = ?";
      queryParams.push(params.active);
    }

    query += " ORDER BY name ASC";

    if (params?.page && params?.perPage) {
      const offset = (params.page - 1) * params.perPage;
      query += " LIMIT ? OFFSET ?";
      queryParams.push(params.perPage, offset);
    }

    const result = await database.getAllAsync(query, queryParams);
    return result as CategoryModelInterface[];

  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

async function count(params?: Omit<CategorySearchInterface, 'page' | 'perPage'>) {
  try {
    console.log({params});
    let query = "SELECT COUNT(*) as total FROM categories WHERE deleted_at IS NULL";
    const queryParams: any[] = [];

    if (params?.name) {
      query += " AND name LIKE ?";
      queryParams.push(`%${params.name}%`);
    }

    if (params?.description) {
      query += " AND description LIKE ?";
      queryParams.push(`%${params.description}%`);
    }

    if (params?.active !== undefined) {
      query += " AND active = ?";
      queryParams.push(params.active);
    }

    const result = await database.getFirstAsync(query, queryParams) as { total: number };
    return result.total;

  } catch (error) {
    console.error("Error counting categories:", error);
    throw new Error("Failed to count categories");
  }
}
  async function show(id: number) {
    try {
      const result = await database.getFirstAsync(
        "SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL",
        [id],
      );
      return result as CategoryModelInterface | null;
    } catch (error) {
      console.error("Error fetching category:", error);
      throw new Error("Failed to fetch category");
    }
  }

  async function update(params: CategoryUpdateInterface) {
    const statement = await database.prepareAsync(
      "UPDATE categories SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
    );
    try {
      await statement.executeAsync(
        params.name || "",
        params.description || "",
        params.id,
      );
      return await show(params.id);
    } catch (error) {
      console.error("Error updating category:", error);
      throw new Error("Failed to update category");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function remove(id: number) {
    const statement = await database.prepareAsync(
      "UPDATE categories SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
    );
    try {
      await statement.executeAsync(id);
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw new Error("Failed to delete category");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function toggleActive(id: number) {
    try {
      const category = await show(id);
      if (!category) {
        throw new Error("Category not found");
      }

      const newActiveStatus = category.active === 1 ? 0 : 1;

      const statement = await database.prepareAsync(
        "UPDATE categories SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      );

      try {
        await statement.executeAsync(newActiveStatus, id);
        return await show(id);
      } finally {
        await statement.finalizeAsync();
      }
    } catch (error) {
      console.error("Error toggling category status:", error);
      throw new Error("Failed to toggle category status");
    }
  }

  return { store, index, count, show, update, remove, toggleActive };
}
