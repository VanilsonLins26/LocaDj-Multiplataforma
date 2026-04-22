import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AdminUsersScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Ionicons name="people" size={60} color="#9CA3AF" />
      <Text style={styles.text}>Gerenciamento de Usuários (Em Breve)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  }
});
