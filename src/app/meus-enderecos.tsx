import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

// --- Types ---

interface Address {
  id: string;
  label: string;
  street: string;
  complement: string;
  isPrimary: boolean;
}

// --- Sample Data ---

const INITIAL_ADDRESSES: Address[] = [
  {
    id: '1',
    label: 'Casa',
    street: 'Rua das Flores, 123',
    complement: 'Meireles, Fortaleza - CE',
    isPrimary: true,
  },
  {
    id: '2',
    label: 'Trabalho',
    street: 'Av. Bezerra de Menezes, 456',
    complement: 'São Gerardo, Fortaleza - CE',
    isPrimary: false,
  },
];

// --- Component ---

export default function MeusEnderecosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);

  function handleMenuPress(address: Address) {
    Alert.alert(address.label, 'Escolha uma ação', [
      {
        text: 'Definir como principal',
        onPress: () =>
          setAddresses((prev) =>
            prev.map((a) => ({ ...a, isPrimary: a.id === address.id }))
          ),
      },
      { text: 'Editar', onPress: () => {} },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => setAddresses((prev) => prev.filter((a) => a.id !== address.id)),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Endereços</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Nenhum endereço cadastrado</Text>
            <Text style={styles.emptySubtitle}>
              Adicione um endereço para facilitar suas reservas.
            </Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View
              key={address.id}
              style={[styles.card, address.isPrimary && styles.cardPrimary]}
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconWrapper,
                  address.isPrimary ? styles.iconWrapperPrimary : styles.iconWrapperSecondary,
                ]}
              >
                {address.isPrimary ? (
                  <Ionicons name="location-outline" size={22} color="#5245F1" />
                ) : (
                  <Feather name="lock" size={20} color="#666666" />
                )}
              </View>

              {/* Info */}
              <View style={styles.cardContent}>
                <View style={styles.cardLabelRow}>
                  <Text style={styles.cardLabel}>{address.label}</Text>
                  {address.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Principal</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardStreet}>{address.street}</Text>
                <Text style={styles.cardComplement}>{address.complement}</Text>
              </View>

              {/* Three-dot menu */}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => handleMenuPress(address)}
                activeOpacity={0.7}
              >
                <Feather name="more-vertical" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={() => router.push('/novo-endereco')}>
          <Feather name="plus" size={18} color="#5245F1" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>Adicionar Novo Endereço</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F9',
  },
  header: {
    backgroundColor: '#5245F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  // Scroll
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 16,
  },

  // Cards
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardPrimary: {
    borderWidth: 2,
    borderColor: '#5245F1',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  iconWrapperPrimary: {
    backgroundColor: '#ECECFF',
  },
  iconWrapperSecondary: {
    backgroundColor: '#F4F4F9',
  },
  cardContent: {
    flex: 1,
  },
  cardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  primaryBadge: {
    backgroundColor: '#ECECFF',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5245F1',
  },
  cardStreet: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
  },
  cardComplement: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  menuButton: {
    padding: 8,
    marginRight: -8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  // Footer button
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#F4F4F9',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECECFF',
    borderWidth: 1.5,
    borderColor: '#5245F1',
    borderRadius: 100,
    height: 56,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5245F1',
  },
});
