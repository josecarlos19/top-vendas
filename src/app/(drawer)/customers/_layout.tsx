import { Stack } from "expo-router";

export default function CustomersLayout() {
  return (
    <Stack
      screenOptions={{
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
          title: "Clientes",
          headerRight: () => null,
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="create"
        options={{
          title: "Novo(a) Cliente",
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title: "Editar Cliente",
          presentation: "modal",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
