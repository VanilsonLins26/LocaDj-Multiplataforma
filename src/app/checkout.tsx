import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebaseConfig';
import * as Linking from 'expo-linking';

const PRIMARY = '#5B4EE4';
const GRAY_100 = '#F3F4F6';
const GRAY_200 = '#E5E7EB';
const GRAY_400 = '#9CA3AF';
const GRAY_500 = '#6B7280';
const GRAY_800 = '#1F2937';
const GRAY_900 = '#111827';
const WHITE = '#FFFFFF';

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

      const body: Record<string, unknown> = {
        kit: { id: Number(kitId) },
        startDateTime: startDate,
        endDateTime: endDate,
      };

      if (currentUser?.email) {
        body.user = { email: currentUser.email };
      }

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
            Alert.alert('Erro', 'Backend retornou OK mas nenhum ID foi encontrado. Verifique se não redirecionou para Login.');
            setSubmitting(false);
            return;
          }
        } catch (err) {
            // Backend mandou HTML (pagina de login por erro de auth do Spring)
            // Para poderem apresentar a Sprint 3 hoje apesar dessa falha no backend:
            Alert.alert(
              'Aviso do Backend', 
              'A API barrou a reserva solicitando Login. Deseja simular a criação para continuidade da apresentação (Sprint 3)?',
              [
                { text: 'Cancelar', style: 'cancel', onPress: () => setSubmitting(false) },
                { text: 'Simular', onPress: () => {
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
                }}
              ]
            );
            return;
        }
      } else {
        Alert.alert('Erro', `Não foi possível registrar a reserva no backend. HTTP ${resp.status}`);
        setSubmitting(false);
        return;
      }

      // 2. Enviar POST para rotear o Mercado Pago
      if (reservationId) {
        const checkoutResp = await fetch('https://locadj.onrender.com/api/checkout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            reservationId: reservationId,
            token: token
          })
        });

        if (checkoutResp.ok) {
          const checkoutData = await checkoutResp.text();
          try {
            // Tenta tratar como JSON
            const jsonData = JSON.parse(checkoutData);
            if (jsonData?.sandbox_init_point || jsonData?.init_point) {
               Linking.openURL(jsonData.sandbox_init_point || jsonData.init_point);
               return;
            } else if (jsonData?.url) {
               Linking.openURL(jsonData.url);
               return;
            }
          } catch {
             // Caso a API retorne a URL diretamente como String
             if (checkoutData.startsWith('http')) {
               Linking.openURL(checkoutData);
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: PRIMARY }}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} translucent />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backBtnWrapper}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={WHITE} />
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
                  <Ionicons name="cube-outline" size={24} color={GRAY_400} />
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
              <ActivityIndicator size="small" color={WHITE} />
            ) : (
              <>
                <Text style={styles.btnFinalizeText}>Finalizar com Mercado Pago</Text>
                <Ionicons name="lock-closed" size={16} color={WHITE} style={{ marginLeft: 8 }} />
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
    backgroundColor: GRAY_100,
  },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backBtnWrapper: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GRAY_800,
    marginBottom: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
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
    backgroundColor: GRAY_100,
  },
  kitImgPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: GRAY_100,
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
    color: GRAY_900,
    marginBottom: 4,
  },
  kitPrice: {
    fontSize: 14,
    color: GRAY_800,
    fontWeight: '600',
  },
  kitDays: {
    fontSize: 13,
    color: GRAY_500,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: GRAY_200,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    color: GRAY_500,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: PRIMARY,
  },
  paymentMethodCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
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
    backgroundColor: '#E5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mpTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GRAY_900,
    marginBottom: 4,
  },
  mpSubtitle: {
    fontSize: 13,
    color: GRAY_500,
  },
  footer: {
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: GRAY_200,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  btnFinalize: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  btnFinalizeText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});
