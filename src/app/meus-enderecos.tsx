import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { addressService } from '../services/addressService';
import { Address } from '../types/address';


// --- Component ---

export default function MeusEnderecosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadAddresses();
    }, [])
  );

  async function loadAddresses() {
    try {
      setLoading(true);
      const data = await addressService.listAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Erro ao carregar endereços:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus endereços.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await addressService.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir o endereço.');
    }
  }

  async function handleSetPrimary(id: string) {
    try {
      await addressService.setPrimary(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isPrimary: a.id === id }))
      );
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível definir como principal.');
    }
  }

  function handleMenuPress(address: Address) {
    if (Platform.OS === 'web') {
      // Usa Modal para Web pois Alert c/ 3+ botões não funciona no DOM
      setSelectedAddress(address);
    } else {
      Alert.alert(address.label, 'Escolha uma ação', [
        {
          text: 'Definir como principal',
          onPress: () => handleSetPrimary(address.id),
        },
        {
          text: 'Editar',
          onPress: () => {
            router.push({
              pathname: '/novo-endereco',
              params: {
                editMode: 'true',
                id: address.id,
                cep: address.zipCode,
                rua: address.street,
                numero: address.number,
                complemento: address.complement || '',
                bairro: address.neighborhood,
                cidadeEstado: `${address.city} - ${address.state}`,
                salvarComo: address.label,
                isPrimary: String(address.isPrimary)
              }
            });
          }
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => handleDelete(address.id),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  }

  function goBackOrRedirect() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/perfil');
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={goBackOrRedirect} activeOpacity={0.7}>
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
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#5245F1" />
            <Text style={styles.emptyTitle}>Carregando endereços...</Text>
          </View>
        ) : addresses.length === 0 ? (
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
                <Text style={styles.cardStreet}>{address.street}, {address.number}</Text>
                <Text style={styles.cardComplement}>{address.neighborhood}, {address.city} - {address.state}</Text>
                {address.complement ? <Text style={styles.cardComplement}>{address.complement}</Text> : null}
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

      {/* Web Action Sheet Modal */}
      {Platform.OS === 'web' && selectedAddress && (
        <Modal transparent animationType="fade" visible={!!selectedAddress}>
          <TouchableWithoutFeedback onPress={() => setSelectedAddress(null)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedAddress.label}</Text>
                  
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      handleSetPrimary(selectedAddress.id);
                      setSelectedAddress(null);
                    }}
                  >
                    <Feather name="map-pin" size={18} color="#5245F1" />
                    <Text style={styles.modalOptionText}>Definir como principal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      setSelectedAddress(null);
                      router.push({
                        pathname: '/novo-endereco',
                        params: {
                          editMode: 'true',
                          id: selectedAddress.id,
                          cep: selectedAddress.zipCode,
                          rua: selectedAddress.street,
                          numero: selectedAddress.number,
                          complemento: selectedAddress.complement || '',
                          bairro: selectedAddress.neighborhood,
                          cidadeEstado: `${selectedAddress.city} - ${selectedAddress.state}`,
                          salvarComo: selectedAddress.label,
                          isPrimary: String(selectedAddress.isPrimary)
                        }
                      });
                    }}
                  >
                    <Feather name="edit-2" size={18} color="#4B5563" />
                    <Text style={[styles.modalOptionText, { color: '#4B5563' }]}>Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      handleDelete(selectedAddress.id);
                      setSelectedAddress(null);
                    }}
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                    <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Excluir</Text>
                  </TouchableOpacity>

                  <View style={styles.modalDivider} />

                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setSelectedAddress(null)}
                  >
                    <Text style={styles.modalCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40, // extra padding for bottom safe area
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5245F1',
    marginLeft: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  modalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
