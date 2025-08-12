import { useSQLiteContext } from "expo-sqlite";
import { CustomerModelInterface, CustomerSearchInterface, CustomerStoreInterface, CustomerUpdateInterface } from "@/interfaces/models/customerInterface";

export function useCustomerDatabase() {
  const database = useSQLiteContext();

  async function store(params: CustomerStoreInterface) {
    const statement = await database.prepareAsync(
      `INSERT INTO customers (
        name, document, document_type, phone, mobile, email,
        address, neighborhood, city, state, zip_code, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    try {
      const result = await statement.executeAsync(
        params.name,
        params.document,
        params.document_type,
        params.phone || null,
        params.mobile || null,
        params.email,
        params.address || null,
        params.neighborhood || null,
        params.city || null,
        params.state || null,
        params.zip_code || null,
        params.notes || null,
      );
      const id = result.lastInsertRowId.toString();
      return {
        id,
        name: params.name,
        document: params.document,
        document_type: params.document_type,
        phone: params.phone,
        mobile: params.mobile,
        email: params.email,
        address: params.address,
        neighborhood: params.neighborhood,
        city: params.city,
        state: params.state,
        zip_code: params.zip_code,
        notes: params.notes,
      };
    } catch (error) {
      console.error("Error storing customer:", error);
      throw new Error("Failed to store customer");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function index(params?: CustomerSearchInterface) {
  try {
    let query = "SELECT * FROM customers WHERE deleted_at IS NULL";
    const queryParams: any[] = [];

    if (params?.q) {
      query += " AND (name LIKE ? OR email LIKE ? OR document LIKE ?)";
      queryParams.push(`%${params.q}%`, `%${params.q}%`, `%${params.q}%`);
    }

    query += " ORDER BY name ASC";

    if (params?.page && params?.perPage) {
      const offset = (params.page - 1) * params.perPage;
      query += " LIMIT ? OFFSET ?";
      queryParams.push(params.perPage, offset);
    }

    const result = await database.getAllAsync(query, queryParams);
    return result as CustomerModelInterface[];

  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("Failed to fetch customers");
  }
}

async function count(params?: Omit<CustomerSearchInterface, 'page' | 'perPage'>) {
  try {
    let query = "SELECT COUNT(*) as total FROM customers WHERE deleted_at IS NULL";
    const queryParams: any[] = [];

    if (params?.q) {
      query += " AND (name LIKE ? OR email LIKE ? OR document LIKE ?)";
      queryParams.push(`%${params.q}%`, `%${params.q}%`, `%${params.q}%`);
    }

    const result = await database.getFirstAsync(query, queryParams) as { total: number };
    return result.total;

  } catch (error) {
    console.error("Error counting customers:", error);
    throw new Error("Failed to count customers");
  }
}

  async function show(id: number) {
    try {
      const result = await database.getFirstAsync(
        "SELECT * FROM customers WHERE id = ? AND deleted_at IS NULL",
        [id],
      );
      return result as CustomerModelInterface | null;
    } catch (error) {
      console.error("Error fetching customer:", error);
      throw new Error("Failed to fetch customer");
    }
  }

  async function update(params: CustomerUpdateInterface) {
    const statement = await database.prepareAsync(
      `UPDATE customers SET
        name = ?, document = ?, document_type = ?, phone = ?, mobile = ?,
        email = ?, address = ?, neighborhood = ?, city = ?, state = ?,
        zip_code = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND deleted_at IS NULL`,
    );
    try {
      await statement.executeAsync(
        params.name || "",
        params.document || "",
        params.document_type || "",
        params.phone || null,
        params.mobile || null,
        params.email || "",
        params.address || null,
        params.neighborhood || null,
        params.city || null,
        params.state || null,
        params.zip_code || null,
        params.notes || null,
        params.id,
      );
      return await show(params.id);
    } catch (error) {
      console.error("Error updating customer:", error);
      throw new Error("Failed to update customer");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function remove(id: number) {
    const statement = await database.prepareAsync(
      "UPDATE customers SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
    );
    try {
      await statement.executeAsync(id);
      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      throw new Error("Failed to delete customer");
    } finally {
      await statement.finalizeAsync();
    }
  }

  async function toggleActive(id: number) {
    try {
      const customer = await show(id);
      if (!customer) {
        throw new Error("Customer not found");
      }

      const newActiveStatus = customer.active === 1 ? 0 : 1;

      const statement = await database.prepareAsync(
        "UPDATE customers SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      );

      try {
        await statement.executeAsync(newActiveStatus, id);
        return await show(id);
      } finally {
        await statement.finalizeAsync();
      }
    } catch (error) {
      console.error("Error toggling customer status:", error);
      throw new Error("Failed to toggle customer status");
    }
  }

  async function findByEmail(email: string) {
    try {
      const result = await database.getFirstAsync(
        "SELECT * FROM customers WHERE email = ? AND deleted_at IS NULL",
        [email],
      );
      return result as CustomerModelInterface | null;
    } catch (error) {
      console.error("Error finding customer by email:", error);
      throw new Error("Failed to find customer by email");
    }
  }

  async function findByDocument(document: string) {
    try {
      const result = await database.getFirstAsync(
        "SELECT * FROM customers WHERE document = ? AND deleted_at IS NULL",
        [document],
      );
      return result as CustomerModelInterface | null;
    } catch (error) {
      console.error("Error finding customer by document:", error);
      throw new Error("Failed to find customer by document");
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
    findByEmail,
    findByDocument
  };
}
