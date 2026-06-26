import { Tabs } from 'expo-router';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  const theme = 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[theme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[theme].background,
          borderTopWidth: 1,
          borderTopColor: theme === 'dark' ? '#2c2c2e' : '#e5e5ea',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '食事ログ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'calendar' : 'calendar-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'レシピ・食材',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'book' : 'book-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: '市販品',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'storefront' : 'storefront-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
