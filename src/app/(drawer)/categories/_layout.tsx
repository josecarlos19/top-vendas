import { Stack } from "expo-router";

export default function CategoriesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
          color: "#1e293b",
        },
        headerTintColor: "#FF6B35",
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Categorias",
          headerRight: () => null,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="create"
        options={{
          title: "Nova Categoria",
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title: "Editar Categoria",
        }}
      />
    </Stack>
  );
}
