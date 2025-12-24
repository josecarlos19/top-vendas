import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { DrawerContentScrollView } from '@react-navigation/drawer';

function CustomDrawerContent(props: any) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: 'Home',
      route: '/(drawer)',
      icon: 'home-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      name: 'Categorias',
      route: '/(drawer)/categories',
      icon: 'folder-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      name: 'Produtos',
      route: '/(drawer)/products',
      icon: 'pricetag-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      name: 'Clientes',
      route: '/(drawer)/customers',
      icon: 'people-outline' as keyof typeof Ionicons.glyphMap,
    },
    {
      name: 'Vendas',
      route: '/(drawer)/sales',
      icon: 'cart-outline' as keyof typeof Ionicons.glyphMap,
    },
  ];

  const handleNavigation = (route: string) => {
    props.navigation.closeDrawer();

    setTimeout(() => {
      router.replace(route as any);
    }, 200);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.drawerContainer}>
      <View style={styles.drawerHeader}>
        <View style={styles.profileSection}>
          <View style={styles.profileIcon}>
            <Text style={styles.profileText}>JC</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>José Carlos</Text>
            <Text style={styles.profileEmail}>carlojf0@gmail.com</Text>
          </View>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuSection}>
          {menuItems.map(item => {
            const isActive = pathname.startsWith(item.route);

            return (
              <TouchableOpacity
                key={item.route}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => handleNavigation(item.route)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={isActive ? '#667eea' : '#64748b'}
                  style={styles.menuIcon}
                />
                <Text
                  style={[styles.menuText, isActive && styles.menuTextActive]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <Text style={styles.footerText}>Top Vendas App</Text>
      </View>
    </SafeAreaView>
  );
}

export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={CustomDrawerContent}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
            elevation: 4,
            shadowOpacity: 0.1,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
            color: '#1e293b',
          },
          headerTintColor: '#64748b',
          drawerStyle: {
            backgroundColor: '#ffffff',
            width: 280,
          },
          drawerType: 'slide',
          overlayColor: 'rgba(0,0,0,0.5)',
          swipeEnabled: true,
        }}
      >
        <Drawer.Screen
          name='index'
          options={{
            title: 'Dashboard',
            headerTitle: 'Home',
            drawerIcon: ({ color, size }) => (
              <Ionicons name='home-outline' size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name='categories'
          options={{
            title: 'Categorias',
            headerTitle: 'Categorias',
            drawerIcon: ({ color, size }) => (
              <Ionicons name='folder-outline' size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name='customers'
          options={{
            title: 'Clientes',
            headerTitle: 'Clientes',
            drawerIcon: ({ color, size }) => (
              <Ionicons name='people-outline' size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name='products'
          options={{
            title: 'Produtos',
            headerTitle: 'Produtos',
            drawerIcon: ({ color, size }) => (
              <Ionicons name='pricetag-outline' size={size} color={color} />
            ),
          }}
        />

        <Drawer.Screen
          name='sales'
          options={{
            title: 'Vendas',
            headerTitle: 'Vendas',
            drawerIcon: ({ color, size }) => (
              <Ionicons name='cart-outline' size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  drawerHeader: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  profileText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: '#64748b',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileEmail: {
    color: '#64748b',
    fontSize: 14,
  },
  drawerContent: {
    flexGrow: 1,
  },
  menuSection: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginVertical: 2,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: '#f1f5f9',
    borderLeftColor: '#667eea',
  },
  menuIcon: {
    marginRight: 15,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  menuTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});
