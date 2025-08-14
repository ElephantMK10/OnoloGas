import React from 'react';
import { Tabs } from 'expo-router';
import { COLORS } from '../../constants/colors';
import CustomIcon from '../../components/CustomIcon';
import BottomNavBar from '../../components/BottomNavBar';
import { View } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide the default tab bar
      }}
      tabBar={(props) => <BottomNavBar {...props} />} // Use custom tab bar
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <CustomIcon name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          title: 'Order',
          tabBarIcon: ({ color }) => <CustomIcon name="cube" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }) => <CustomIcon name="chatbubble" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <CustomIcon name="cart" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <CustomIcon name="menu" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
