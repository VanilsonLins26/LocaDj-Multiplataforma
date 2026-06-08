import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';
import { addressService } from '../services/addressService';
import { Address } from '../types/address';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

const { width } = Dimensions.get('window');

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { kitId, kitName, kitPrice, kitImageUrl, startDate, endDate, total, days } = useLocalSearchParams();

  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const selectedAddressRef = useRef<Address | null>(null);
  selectedAddressRef.current = selectedAddress;

  useFocusEffect(
    useCallback(() => {
      async function loadAddresses() {
        try {
          setLoadingAddresses(true);
          const list = await addressService.listAddresses();
          setAddresses(list);

          const currentSelected = selectedAddressRef.current;
          if (currentSelected) {
            const stillExists = list.find(a => a.id === currentSelected.id);
            if (stillExists) {
              setSelectedAddress(stillExists);
              return;
            }
          }

          const primary = list.find(a => a.isPrimary);
          if (primary) {
            setSelectedAddress(primary);
          } else if (list.length > 0) {
            setSelectedAddress(list[0]);
          } else {
            setSelectedAddress(null);
          }
        } catch (err) {
          console.warn('Erro ao carregar endereços:', err);
        } finally {
          setLoadingAddresses(false);
        }
      }
      loadAddresses();
    }, [])
  );

  const formatAddressString = (addr: Address) => {
    return `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.neighborhood} - ${addr.city}/${addr.state}, CEP: ${addr.zipCode}`;
  };

  const formatCurrency = (val: number | string | string[] | undefined) => {
    if (!val) return 'R$ 0,00';
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    if (isNaN(num)) return 'R$ 0,00';
    return `R$ ${num.toFixed(2).replace('.', ',')}`;
  };

  const handleCheckout = async () => {
    setSubmitting(true);
    try {
      const currentUser = auth.currentUser;
      const token = await currentUser?.getIdToken();

      const formatToBackendDate = (isoString?: string | string[]) => {
        if (!isoString) return '';
        const str = Array.isArray(isoString) ? isoString[0] : isoString;
        const d = new Date(str);
        if (isNaN(d.getTime())) return '';
        const pad = (n: number) => n.toString().padStart(2, '0');
        // O regex do spring boot exige formato YYYY-MM-DDTHH:mm
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      if (!selectedAddress) {
        Alert.alert('Endereço Necessário', 'Por favor, adicione ou selecione um endereço para entrega.');
        setSubmitting(false);
        return;
      }

      const body = {
        kitId: Number(kitId),
        startDateTime: formatToBackendDate(startDate),
        endDateTime: formatToBackendDate(endDate),
        deliveryAddress: formatAddressString(selectedAddress),
        paymentMethod: 'Mercado Pago',
      };

      // 1. Criar a reserva no backend
      const resp = await fetch('https://locadj.onrender.com/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body),
      });

      let reservationId = null;

      const triggerSimulationBypass = (reason: string) => {
        Alert.alert(
          'Aviso do Backend',
          `A API falhou (${reason}). Deseja simular a criação para continuidade da apresentação (Sprint 3)?`,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setSubmitting(false) },
            {
              text: 'Simular', onPress: () => {
                const fakeResId = Math.floor(Math.random() * 1000);
                Alert.alert(
                  'Simulação Checkout',
                  'Onde deseja testar o comportamento do Mercado Pago?',
                  [
                    {
                      text: 'Simular Pagamento Aprovado',
                      onPress: () => {
                        router.replace({
                          pathname: '/payment/approved',
                          params: { payment_id: 'sim_mp_' + fakeResId, preference_id: fakeResId.toString() }
                        });
                      }
                    },
                    {
                      text: 'Abrir Sandbox Genérico',
                      onPress: () => {
                        Linking.openURL('https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=186411516-72bbac3b-e018-498c-9b88-16cb4ce7da7d');
                        setSubmitting(false);
                      }
                    }
                  ]
                );
              }
            }
          ]
        );
      };

      if (resp.ok || resp.status === 201) {
        const textData = await resp.text();
        try {
          const created = JSON.parse(textData);
          if (created?.id) {
            reservationId = created.id;
            const stored = await AsyncStorage.getItem('my_reservation_ids');
            const ids: number[] = stored ? JSON.parse(stored) : [];
            if (!ids.includes(reservationId)) {
              ids.push(reservationId);
              await AsyncStorage.setItem('my_reservation_ids', JSON.stringify(ids));
            }
            await AsyncStorage.setItem('latest_checkout_reservation_id', String(reservationId));
          } else {
            triggerSimulationBypass('ID não encontrado no JSON');
            return;
          }
        } catch (err) {
          triggerSimulationBypass('HTML / Resposta Inválida');
          return;
        }
      } else {
        let errorMsg = '';
        try {
          const errJson = await resp.json();
          errorMsg = errJson.message || errJson.error || '';
        } catch {
          try {
            errorMsg = await resp.text();
          } catch {}
        }

        const isUnavailable =
          resp.status === 400 ||
          resp.status === 409 ||
          errorMsg.toLowerCase().includes('indisponiv') ||
          errorMsg.toLowerCase().includes('indisponív') ||
          errorMsg.toLowerCase().includes('conflito') ||
          errorMsg.toLowerCase().includes('indisponibilidade') ||
          errorMsg.toLowerCase().includes('already reserved') ||
          errorMsg.toLowerCase().includes('não disponível') ||
          errorMsg.toLowerCase().includes('não disponivel');

        if (isUnavailable) {
          Alert.alert(
            'Período Indisponível',
            'Este kit não está disponível na data selecionada. Por favor, escolha outra data.',
            [
              {
                text: 'Escolher outra data',
                onPress: () => {
                  setSubmitting(false);
                  router.back();
                }
              }
            ]
          );
          return;
        }

        triggerSimulationBypass(`HTTP ${resp.status} - ${errorMsg || 'Bloqueado/Não Autorizado'}`);
        return;
      }

      // 2. Enviar POST para rotear o Mercado Pago
      if (reservationId) {
        const cleanUrl = (url: string) => {
          if (url.includes(':///')) {
            return url.replace(':///', '://localhost/');
          }
          return url;
        };

        const successUrl = cleanUrl(Linking.createURL('/payment/approved'));
        const failureUrl = cleanUrl(Linking.createURL('/payment/failed'));
        const pendingUrl = cleanUrl(Linking.createURL('/payment/pending'));

        const checkoutResp = await fetch('https://locadj.onrender.com/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            reservationId: reservationId,
            successUrl: successUrl,
            failureUrl: failureUrl,
            pendingUrl: pendingUrl
          })
        });

        if (checkoutResp.ok) {
          const checkoutData = await checkoutResp.text();
          try {
            const jsonData = JSON.parse(checkoutData);
            if (jsonData?.redirectUrl) {
              Linking.openURL(jsonData.redirectUrl);
              router.replace('/payment/pending');
              return;
            } else if (jsonData?.sandbox_init_point || jsonData?.init_point) {
              Linking.openURL(jsonData.sandbox_init_point || jsonData.init_point);
              router.replace('/payment/pending');
              return;
            } else if (jsonData?.url) {
              Linking.openURL(jsonData.url);
              router.replace('/payment/pending');
              return;
            }
          } catch {
            if (checkoutData.startsWith('http')) {
              Linking.openURL(checkoutData);
              router.replace('/payment/pending');
              return;
            }
          }
          // Caso consiga sucesso mas não ache URL do mercado pago, 
          // exibe mensagem simulada e vai para a listagem
          Alert.alert('Redirecionando...', 'Sucesso no Checkout, mas o backend não retornou URL do Mercado Pago.', [
            { text: 'Simular', onPress: () => router.replace({ pathname: '/payment/approved', params: { payment_id: 'sim_mp_123', external_reference: String(reservationId) } }) }
          ]);
        } else {
          Alert.alert('Erro', 'O backend do Checkout retornou erro.');
        }
      }
    } catch (e) {
      console.warn('Backend indisponível', e);
      Alert.alert('Erro', 'Verifique sua conexão.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: CARD_BG }}>
      <StatusBar barStyle="light-content" backgroundColor={CARD_BG} translucent />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtnWrapper}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={TEXT_LIGHT} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={styles.backBtnWrapper} />
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Resumo do Pagamento</Text>

          {/* Kit Card */}
          <View style={styles.card}>
            <View style={styles.kitInfoRow}>
              {kitImageUrl ? (
                <Image source={{ uri: kitImageUrl as string }} style={styles.kitImg} />
              ) : (
                <View style={styles.kitImgPlaceholder}>
                  <Ionicons name="cube-outline" size={24} color={TEXT_MUTED} />
                </View>
              )}
              <View style={styles.kitTextCol}>
                <Text style={styles.kitName} numberOfLines={1}>{kitName}</Text>
                <Text style={styles.kitPrice}>{formatCurrency(kitPrice as string)}/dia</Text>
                <Text style={styles.kitDays}>{days} dia(s)</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total as string)}</Text>
            </View>
          </View>

          {/* Endereço de Entrega */}
          <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
          {loadingAddresses ? (
            <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 12 }} />
          ) : selectedAddress ? (
            <View style={styles.addressCard}>
              <View style={styles.addressInfoCol}>
                <View style={styles.addressLabelRow}>
                  <Ionicons name="location" size={16} color={PRIMARY} style={{ marginRight: 6 }} />
                  <Text style={styles.addressCardLabel}>{selectedAddress.label}</Text>
                  {selectedAddress.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Padrão</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {formatAddressString(selectedAddress)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.changeAddressBtn}
                onPress={() => setAddressModalVisible(true)}
              >
                <Text style={styles.changeAddressBtnText}>Alterar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.noAddressCard}>
              <Ionicons name="location-outline" size={24} color={TEXT_MUTED} style={{ marginBottom: 8 }} />
              <Text style={styles.noAddressText}>Nenhum endereço cadastrado</Text>
              <TouchableOpacity
                style={styles.addAddressBtn}
                onPress={() => router.push('/novo-endereco')}
              >
                <Text style={styles.addAddressBtnText}>Cadastrar Endereço</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Meio de Pagamento */}
          <Text style={styles.sectionTitle}>Meio de Pagamento</Text>

          {/* Payment Method Selector */}
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentContent}>
              <View style={styles.mpIconBg}>
                <Ionicons name="card" size={20} color="#009EE3" />
              </View>
              <View>
                <Text style={styles.mpTitle}>Mercado Pago</Text>
                <Text style={styles.mpSubtitle}>Crédito, Débito, Pix ou Boleto</Text>
              </View>
            </View>
            <Ionicons name="checkmark-circle" size={28} color={PRIMARY} />
          </View>
        </ScrollView>

        {/* Bottom Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.btnFinalize, submitting && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleCheckout}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <>
                <Text style={styles.btnFinalizeText}>Finalizar com Mercado Pago</Text>
                <Ionicons name="lock-closed" size={16} color={PRIMARY} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Seleção de Endereço */}
      <Modal
        visible={addressModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha o Endereço de Entrega</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color={TEXT_LIGHT} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
              {addresses.map((addr) => {
                const isSelected = selectedAddress?.id === addr.id;
                return (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.modalAddressItem, isSelected && styles.modalAddressItemActive]}
                    onPress={() => {
                      setSelectedAddress(addr);
                      setAddressModalVisible(false);
                    }}
                  >
                    <View style={styles.modalAddressHeader}>
                      <Ionicons name="location" size={16} color={isSelected ? PRIMARY : TEXT_MUTED} style={{ marginRight: 6 }} />
                      <Text style={[styles.modalAddressLabel, isSelected && styles.modalAddressLabelActive]}>
                        {addr.label}
                      </Text>
                      {addr.isPrimary && (
                        <View style={styles.modalPrimaryBadge}>
                          <Text style={styles.modalPrimaryBadgeText}>Padrão</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.modalAddressText}>
                      {`${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.neighborhood} - ${addr.city}/${addr.state}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalManageBtn}
              onPress={() => {
                setAddressModalVisible(false);
                router.push('/meus-enderecos');
              }}
            >
              <Ionicons name="settings-outline" size={16} color={PRIMARY} style={{ marginRight: 6 }} />
              <Text style={styles.modalManageBtnText}>Gerenciar Endereços</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtnWrapper: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BORDER,
  },
  kitInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  kitImg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: CARD_BG,
  },
  kitImgPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kitTextCol: {
    flex: 1,
    marginLeft: 16,
  },
  kitName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  kitPrice: {
    fontSize: 14,
    color: TEXT_LIGHT,
    fontWeight: '600',
  },
  kitDays: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PRIMARY,
  },
  paymentMethodCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mpIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 158, 227, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  mpSubtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  footer: {
    backgroundColor: CARD_BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  btnFinalize: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  btnFinalizeText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  addressCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressInfoCol: {
    flex: 1,
    marginRight: 12,
  },
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressCardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  primaryBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
  },
  addressText: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  changeAddressBtn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  changeAddressBtnText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
  },
  noAddressCard: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAddressText: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 16,
    textAlign: 'center',
  },
  addAddressBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  addAddressBtnText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  modalList: {
    marginBottom: 16,
  },
  modalAddressItem: {
    backgroundColor: '#09090B',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  modalAddressItemActive: {
    borderColor: PRIMARY,
  },
  modalAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalAddressLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  modalAddressLabelActive: {
    color: PRIMARY,
  },
  modalPrimaryBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  modalPrimaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
  },
  modalAddressText: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
    paddingLeft: 22,
  },
  modalManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 16,
    height: 52,
    marginTop: 8,
  },
  modalManageBtnText: {
    color: PRIMARY,
    fontSize: 15,
    fontWeight: '700',
  },
});
