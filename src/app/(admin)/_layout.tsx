import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsLandscape } from '../../hooks/useIsLandscape';

const BG = '#09090B';
const BORDER = '#27272A';
const ACTIVE = '#8B5CF6';
const INACTIVE = '#A1A1AA';

export default function AdminTabsLayout() {
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
          height: isLandscape ? 40 + insets.bottom : 60 + insets.bottom,
          paddingBottom: isLandscape ? 2 + (insets.bottom > 0 ? insets.bottom - 4 : 0) : 8 + (insets.bottom > 0 ? insets.bottom - 4 : 0),
          paddingTop: isLandscape ? 2 : 6,
        },
        tabBarLabelStyle: {
          fontSize: isLandscape ? 9 : 10,
          fontWeight: '500',
          marginTop: isLandscape ? 1 : 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={isLandscape ? size - 4 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Usuários',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={isLandscape ? size - 4 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kits"
        options={{
          title: 'Kits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={isLandscape ? size - 4 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={isLandscape ? size - 4 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={isLandscape ? size - 4 : size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="change-password"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="admin-kit-form"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="admin-profile-data"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="user/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="admin-reservation/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="user-report/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
