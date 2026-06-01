import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, orientation: 'default' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="kit/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ headerShown: false }} />
      <Stack.Screen name="meus-dados" options={{ headerShown: false }} />
      <Stack.Screen name="meus-enderecos" options={{ headerShown: false }} />
      <Stack.Screen name="novo-endereco" options={{ headerShown: false }} />
      <Stack.Screen name="reservation/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="reservation-success" options={{ headerShown: false }} />
      <Stack.Screen name="sobre-o-app" options={{ headerShown: false }} />
      <Stack.Screen name="suporte" options={{ headerShown: false }} />

      {/* Auth screens — travadas em retrato */}
      <Stack.Screen name="index" options={{ headerShown: false, orientation: 'portrait' }} />
      <Stack.Screen name="login" options={{ headerShown: false, orientation: 'portrait' }} />
      <Stack.Screen name="register" options={{ headerShown: false, orientation: 'portrait' }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false, orientation: 'portrait' }} />
      <Stack.Screen name="confirm-email" options={{ headerShown: false, orientation: 'portrait' }} />
      <Stack.Screen name="alterar-senha" options={{ headerShown: false, orientation: 'portrait' }} />

      {/* Payment screens — travadas em retrato */}
      <Stack.Screen name="payment/approved" options={{ headerShown: false, orientation: 'portrait' }} />
      <Stack.Screen name="payment/failed" options={{ headerShown: false, orientation: 'portrait' }} />
      <Stack.Screen name="payment/pending" options={{ headerShown: false, orientation: 'portrait' }} />
    </Stack>
  );
}
