import { initializeDatabase } from "@/database/db";
import { Slot } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

export default function Layout() {
  return (
    <SQLiteProvider databaseName="top-vendas.db" onInit={initializeDatabase}>
      <Slot />
    </SQLiteProvider>
  );
}
