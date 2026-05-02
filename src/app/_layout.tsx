import { initializeDatabase } from '@/database/db';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName='top-vendas.db' onInit={initializeDatabase}>
        <StatusBar style='dark' translucent={false} backgroundColor='#fff' />
        <Stack screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#000',
          headerTitleStyle: { fontWeight: '600' },
        }}>
          <Stack.Screen name='(drawer)' options={{ headerShown: false }} />
          <Stack.Screen
            name='categories/create'
            options={{
              presentation: 'card',
              title: 'Nova Categoria',
            }}
          />
          <Stack.Screen
            name='categories/[id]/edit'
            options={{
              presentation: 'card',
              title: 'Editar Categoria',
            }}
          />
          <Stack.Screen
            name='customers/create'
            options={{
              presentation: 'card',
              title: 'Novo Cliente',
            }}
          />
          <Stack.Screen
            name='customers/[id]/edit'
            options={{
              presentation: 'card',
              title: 'Editar Cliente',
            }}
          />
          <Stack.Screen
            name='products/create'
            options={{
              presentation: 'card',
              title: 'Novo Produto',
            }}
          />
          <Stack.Screen
            name='products/[id]/edit'
            options={{
              presentation: 'card',
              title: 'Editar Produto',
            }}
          />
          <Stack.Screen
            name='sales/create'
            options={{
              presentation: 'card',
              title: 'Nova Venda',
            }}
          />
          <Stack.Screen
            name='sales/[id]/edit'
            options={{
              presentation: 'card',
              title: 'Editar Venda',
            }}
          />
          <Stack.Screen
            name='reports'
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
