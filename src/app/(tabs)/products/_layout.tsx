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
          title: "Produtos",
          headerRight: () => null,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
