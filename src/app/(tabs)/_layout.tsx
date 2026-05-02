import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDueNotifications } from '@/hooks/useDueNotifications';
import { useLowStockNotifications } from '@/hooks/useLowStockNotifications';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { notifications } = useDueNotifications();
  const { notifications: lowStockNotifications } = useLowStockNotifications();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTitleStyle: { fontWeight: '600', fontSize: 18, color: '#1e293b' },
        headerTintColor: '#64748b',
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={require('../../../assets/images/favicon.png')}
                style={{ width: 28, height: 28, marginRight: 8, borderRadius: 6 }}
              />
              <Text style={{ fontWeight: '600', fontSize: 18, color: '#1e293b' }}>Top Vendas</Text>
            </View>
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='home-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='products'
        options={{
          title: 'Produtos',
          headerTitle: 'Produtos',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name='bag-outline' size={size} color={color} />
              {lowStockNotifications.totalCount > 0 && (
                <View style={[styles.badge, styles.warningBadge]}>
                  <Text style={styles.badgeText}>
                    {lowStockNotifications.totalCount > 99 ? '99+' : lowStockNotifications.totalCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='customers'
        options={{
          title: 'Clientes',
          headerTitle: 'Clientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='people-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='sales'
        options={{
          title: 'Vendas',
          headerTitle: 'Vendas',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name='cart-outline' size={size} color={color} />
              {notifications.totalCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notifications.totalCount > 99 ? '99+' : notifications.totalCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Perfil',
          headerTitle: 'Meu Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name='person-circle-outline' size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='backup'
        options={{
          href: null,
          headerTitle: 'Backup & Restauração',
        }}
      />
      <Tabs.Screen
        name='reports-list'
        options={{
          href: null,
          headerTitle: 'Relatórios',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  warningBadge: {
    backgroundColor: '#f97316',
  },
});
