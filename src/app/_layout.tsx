import { initializeDatabase } from "@/database/db";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="top-vendas.db" onInit={initializeDatabase}>
        <StatusBar style="dark" backgroundColor="#ffffff" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(drawer)" />
        </Stack>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
