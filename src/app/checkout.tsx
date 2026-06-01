import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';

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

      const body = {
        kitId: Number(kitId),
        startDateTime: formatToBackendDate(startDate),
        endDateTime: formatToBackendDate(endDate),
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
          } else {
            triggerSimulationBypass('ID não encontrado no JSON');
            return;
          }
        } catch (err) {
          triggerSimulationBypass('HTML / Resposta Inválida');
          return;
        }
      } else {
        triggerSimulationBypass(`HTTP ${resp.status} - Bloqueado/Não Autorizado`);
        return;
      }

      // 2. Enviar POST para rotear o Mercado Pago
      if (reservationId) {
        const successUrl = Linking.createURL('/payment/approved');
        const failureUrl = Linking.createURL('/payment/rejected');
        const pendingUrl = Linking.createURL('/payment/pending');

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
            { text: 'Simular', onPress: () => router.replace({ pathname: '/payment/approved', params: { payment_id: '123', preference_id: String(reservationId) } }) }
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

        <View style={styles.content}>
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
        </View>

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
});
