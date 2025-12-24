import { initializeDatabase } from '@/database/db';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName='top-vendas.db' onInit={initializeDatabase}>
        <StatusBar style='dark' />
        <Stack>
          <Stack.Screen name='(drawer)' options={{ headerShown: false }} />
          <Stack.Screen
            name='categories/create'
            options={{
              presentation: 'card',
              title: 'Nova Categoria',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#000',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
          <Stack.Screen
            name='categories/[id]/edit'
            options={{
              presentation: 'card',
              title: 'Editar Categoria',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#000',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
          <Stack.Screen
            name='customers/create'
            options={{
              presentation: 'card',
              title: 'Novo Cliente',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#000',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
          <Stack.Screen
            name='customers/[id]/edit'
            options={{
              presentation: 'card',
              title: 'Editar Cliente',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#000',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
          <Stack.Screen
            name='products/create'
            options={{
              presentation: 'card',
              title: 'Novo Produto',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#000',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
          <Stack.Screen
            name='products/[id]/edit'
            options={{
              presentation: 'card',
              title: 'Editar Produto',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#000',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
          <Stack.Screen
            name='sales/create'
            options={{
              presentation: 'card',
              title: 'Nova Venda',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#000',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
          <Stack.Screen
            name='sales/[id]/edit'
            options={{
              presentation: 'card',
              title: 'Editar Venda',
              headerStyle: { backgroundColor: '#fff' },
              headerTintColor: '#000',
              headerTitleStyle: { fontWeight: '600' },
            }}
          />
        </Stack>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
