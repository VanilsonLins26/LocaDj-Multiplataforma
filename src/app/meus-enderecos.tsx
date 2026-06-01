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

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

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
          <Feather name="arrow-left" size={24} color={TEXT_LIGHT} />
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
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.emptyTitle}>Carregando endereços...</Text>
          </View>
        ) : addresses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color={BORDER} />
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
                  <Ionicons name="location-outline" size={22} color={PRIMARY} />
                ) : (
                  <Feather name="lock" size={20} color={TEXT_MUTED} />
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
                <Feather name="more-vertical" size={20} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8} onPress={() => router.push('/novo-endereco')}>
          <Feather name="plus" size={18} color={PRIMARY} style={{ marginRight: 8 }} />
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
                    <Feather name="map-pin" size={18} color={PRIMARY} />
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
                    <Feather name="edit-2" size={18} color={TEXT_MUTED} />
                    <Text style={[styles.modalOptionText, { color: TEXT_MUTED }]}>Editar</Text>
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
    backgroundColor: BG,
  },
  header: {
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },

  // Scroll
  scrollContent: {
    paddingTop: 24,
    paddingHorizontal: 20,
    gap: 16,
  },

  // Cards
  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPrimary: {
    borderColor: PRIMARY,
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
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  iconWrapperSecondary: {
    backgroundColor: BORDER,
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
    color: TEXT_LIGHT,
  },
  primaryBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PRIMARY,
  },
  cardStreet: {
    fontSize: 13,
    color: TEXT_LIGHT,
    marginBottom: 2,
  },
  cardComplement: {
    fontSize: 12,
    color: TEXT_MUTED,
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
    color: TEXT_LIGHT,
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
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
    backgroundColor: BG,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 100,
    height: 56,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40, // extra padding for bottom safe area
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
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
    color: PRIMARY,
    marginLeft: 12,
  },
  modalDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 8,
  },
  modalCancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
});
