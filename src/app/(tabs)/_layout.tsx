import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsLandscape } from '../../hooks/useIsLandscape';

const BG = '#09090B';
const BORDER = '#27272A';
const ACTIVE = '#8B5CF6';
const INACTIVE = '#A1A1AA';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { isLandscape } = useIsLandscape();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: BG,
          borderTopWidth: 1,
          borderTopColor: BORDER,
          height: isLandscape ? 44 + insets.bottom : 60 + insets.bottom,
          paddingBottom: isLandscape ? 4 + (insets.bottom > 0 ? insets.bottom - 4 : 0) : 8 + (insets.bottom > 0 ? insets.bottom - 4 : 0),
          paddingTop: isLandscape ? 4 : 6,
        },
        tabBarLabelStyle: {
          fontSize: isLandscape ? 10 : 12,
          fontWeight: '600',
          marginTop: isLandscape ? 2 : 4,
        },
      }}>
      <Tabs.Screen
        name="kits_list"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={isLandscape ? size - 2 : size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={isLandscape ? size - 2 : size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={isLandscape ? size - 2 : size + 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}