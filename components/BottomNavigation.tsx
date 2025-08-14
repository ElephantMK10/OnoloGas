// Deprecated file, replaced by BottomNavBar.tsx
export {};

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomIcon from './CustomIcon';
import { COLORS } from '../constants/colors';
import { usePathname, useRouter } from 'expo-router';
import { useCart } from '../context/CartContext';

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();

  const tabs = [
    {
      name: 'Home',
      path: '/(tabs)',
      icon: 'home-outline',
      activeIcon: 'home',
    },
    {
      name: 'Order',
      path: '/(tabs)/order',
      icon: 'flame-outline',
      activeIcon: 'flame',
    },
    {
      name: 'Cart',
      path: '/(tabs)/cart',
      icon: 'cart-outline',
      activeIcon: 'cart',
      badge: totalItems > 0 ? totalItems : undefined,
    },
    {
      name: 'Chat',
      path: '/(tabs)/chat',
      icon: 'chatbubble-outline',
      activeIcon: 'chatbubble',
    },
    {
      name: 'Menu',
      path: '/(tabs)/menu',
      icon: 'menu-outline',
      activeIcon: 'menu',
    },
  ];

  const isActive = (path: string) => {
    // Remove the (tabs) group prefix for comparison because Expo Router
    // strips group names from the actual pathname (e.g. "/order" instead of "‎/(tabs)/order").
    const cleanedTarget = path.replace('/(tabs)', '') || '/';
    const cleanedCurrent = pathname.replace('/(tabs)', '') || '/';

    // Treat root variations as the same ("/", "/index").
    if (cleanedTarget === '/' && (cleanedCurrent === '/' || cleanedCurrent === '/index')) {
      return (
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <View style={styles.container}>
            {tabs.map((tab) => {
              const active = isActive(tab.path);
              return (
                <TouchableOpacity
                  key={tab.name}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab.path)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabInner, active && styles.activeTab]}>
                    <CustomIcon
                      name={active ? (tab.activeIcon as any) : (tab.icon as any)}
                      size={24}
                      color={active ? COLORS.primary : COLORS.text.gray}
                    />
                    <Text style={[styles.tabText, active && styles.activeTabText]}>{tab.name}</Text>
                  </View>
                  {tab.badge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{tab.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      );
    }

    return cleanedCurrent === cleanedTarget;
  };

  const handleTabPress = (path: string) => {
    // Prevent navigation if already on the target path
    if (pathname === path) {
      return;
    }

    // Use replace for main tabs to prevent stacking
    router.replace(path);
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => handleTabPress(tab.path)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabInner, active && styles.activeTab]}>
                <CustomIcon
                  name={active ? tab.activeIcon : tab.icon}
                  size={24}
                  color={active ? COLORS.primary : COLORS.text.gray}
                />
                <Text style={[styles.tabText, active && styles.activeTabText]}>{tab.name}</Text>
                {tab.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#000',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)', // Semi-transparent primary color
  },
  tabText: {
    color: COLORS.text.gray,
    fontSize: 12,
    marginTop: 4,
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: '25%',
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.text.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});
