import { initializeDatabase } from "@/database/db";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="top-vendas.db" onInit={initializeDatabase}>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen
            name="(drawer)"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="categories/create"
            options={{
              presentation: 'modal',
              title: "Nova Categoria",
              headerStyle: { backgroundColor: "#667eea" },
              headerTintColor: "#ffffff",
              headerTitleStyle: { fontWeight: "600" },
            }}
          />
          <Stack.Screen
            name="categories/[id]/edit"
            options={{
              presentation: 'modal',
              title: "Editar Categoria",
              headerStyle: { backgroundColor: "#667eea" },
              headerTintColor: "#ffffff",
              headerTitleStyle: { fontWeight: "600" },
            }}
          />
          <Stack.Screen
            name="customers/create"
            options={{
              presentation: 'modal',
              title: "Novo Cliente",
              headerStyle: { backgroundColor: "#667eea" },
              headerTintColor: "#ffffff",
              headerTitleStyle: { fontWeight: "600" },
            }}
          />
          <Stack.Screen
            name="customers/[id]/edit"
            options={{
              presentation: 'modal',
              title: "Editar Cliente",
              headerStyle: { backgroundColor: "#667eea" },
              headerTintColor: "#ffffff",
              headerTitleStyle: { fontWeight: "600" },
            }}
          />
          <Stack.Screen
            name="products/create"
            options={{
              presentation: 'modal',
              title: "Novo Produto",
              headerStyle: { backgroundColor: "#667eea" },
              headerTintColor: "#ffffff",
              headerTitleStyle: { fontWeight: "600" },
            }}
          />
          <Stack.Screen
            name="products/[id]/edit"
            options={{
              presentation: 'modal',
              title: "Editar Produto",
              headerStyle: { backgroundColor: "#667eea" },
              headerTintColor: "#ffffff",
              headerTitleStyle: { fontWeight: "600" },
            }}
          />
        </Stack>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
