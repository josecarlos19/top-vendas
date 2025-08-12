import { type SQLiteDatabase } from "expo-sqlite";

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        document TEXT NOT NULL,
        document_type TEXT NOT NULL,
        phone TEXT,
        mobile TEXT,
        email TEXT NOT NULL UNIQUE,
        address TEXT,
        neighborhood TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        notes TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`,
    );
    await db.execAsync(
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        barcode TEXT,
        reference TEXT,
        description TEXT,
        cost_price INTEGER,
        sale_price INTEGER,
        wholesale_price INTEGER,
        current_stock INTEGER,
        minimum_stock INTEGER,
        category_id INTEGER,
        supplier TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );`,
    );
  });
}
