import { Stack } from 'expo-router';
import React from 'react';

export default function AdminStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(admin-tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="admin-kit-form" options={{ headerShown: false }} />
      <Stack.Screen name="admin-profile-data" options={{ headerShown: false }} />
      <Stack.Screen name="change-password" options={{ headerShown: false }} />
      <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="admin-reservation/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="user-report/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
