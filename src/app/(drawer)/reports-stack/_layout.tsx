import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: '600' },
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name='sales-by-period'
        options={{
          title: 'Vendas por Período',
        }}
      />
      <Stack.Screen
        name='sales-by-customer'
        options={{
          title: 'Vendas por Cliente',
        }}
      />
      <Stack.Screen
        name='top-products'
        options={{
          title: 'Produtos Mais Vendidos',
        }}
      />
      <Stack.Screen
        name='top-categories'
        options={{
          title: 'Categorias Mais Vendidas',
        }}
      />
    </Stack>
  );
}
