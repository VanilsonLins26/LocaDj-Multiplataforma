import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';
const SUCCESS = '#10B981';

import { auth } from '../../config/firebaseConfig';

const { width, height } = Dimensions.get('window');

const formatApprovedDate = (isoString?: string) => {
  if (!isoString) return 'A definir';

  // Trunca microssegundos para milissegundos para evitar problemas de compatibilidade no React Native
  const sanitized = isoString.replace(/(\.\d{3})\d+/, '$1');

  // Se não tiver indicador de fuso horário, tratamos como UTC
  const hasTimezone = sanitized.includes('Z') || sanitized.includes('-') || sanitized.includes('+');
  const str = hasTimezone ? sanitized : `${sanitized}Z`;
  const dateObj = new Date(str);
  if (isNaN(dateObj.getTime())) return isoString;

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Se tratamos como UTC ou se foi passado em UTC (com Z), convertemos para Horário de Brasília (UTC-3)
  if (!hasTimezone || sanitized.endsWith('Z')) {
    const brtDate = new Date(dateObj.getTime() - (3 * 60 * 60 * 1000));
    const d = pad(brtDate.getUTCDate());
    const m = pad(brtDate.getUTCMonth() + 1);
    const y = brtDate.getUTCFullYear();
    const hs = pad(brtDate.getUTCHours());
    const ms = pad(brtDate.getUTCMinutes());
    return `${d}/${m}/${y} às ${hs}:${ms}`;
  } else {
    // Caso contrário, usamos a hora local corrigida pelo fuso
    const d = pad(dateObj.getDate());
    const m = pad(dateObj.getMonth() + 1);
    const y = dateObj.getFullYear();
    const hs = pad(dateObj.getHours());
    const ms = pad(dateObj.getMinutes());
    return `${d}/${m}/${y} às ${hs}:${ms}`;
  }
};

export default function PaymentApprovedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const localParams = useLocalSearchParams();
  const globalParams = useGlobalSearchParams();
  const deepLinkUrl = Linking.useURL();
  const parsedDeepLink = deepLinkUrl ? Linking.parse(deepLinkUrl) : null;
  const deepLinkParams = parsedDeepLink?.queryParams || {};

  const params = {
    ...globalParams,
    ...localParams,
    ...deepLinkParams
  };

  const { payment_id, external_reference, preference_id } = params;

  const [paymentMethod, setPaymentMethod] = useState("A definir");
  const [paymentDate, setPaymentDate] = useState("A definir");
  const [paymentAmount, setPaymentAmount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({
    queryParams: {},
    resId: null,
    authStatus: 'Iniciando',
    resFetch: 'Não executado',
    statusFetch: 'Não executado',
  });

  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideUpValue = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ]).start();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthLoaded(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoaded) return;

    let active = true;

    async function fetchApiData() {
      // 1. Tenta pegar o ID dos parâmetros
      let resId = null;
      if (external_reference && /^\d+$/.test(String(external_reference))) {
        resId = String(external_reference);
      } else if (preference_id && /^\d+$/.test(String(preference_id))) {
        resId = String(preference_id);
      } else {
        resId = external_reference || preference_id;
      }

      // 2. Se não achou na URL, busca do AsyncStorage (fallback de redirecionamento limpo da Web/APK)
      let storageResId = null;
      let usedStorageFallback = false;
      try {
        storageResId = await AsyncStorage.getItem('latest_checkout_reservation_id');
        if (!resId && storageResId) {
          resId = storageResId;
          usedStorageFallback = true;
        }
      } catch (err) {
        console.warn('Erro ao ler reservation_id do AsyncStorage:', err);
      }

      const info: any = {
        queryParams: { payment_id, external_reference, preference_id },
        authStatus: currentUser ? `Logado: ${currentUser.email}` : 'Deslogado (Sem Auth)',
        storageResId,
        usedStorageFallback,
      };

      info.resId = resId;

      try {
        const idToken = currentUser ? await currentUser.getIdToken() : null;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        console.log('APPROVED SCREEN PARAMS:', { payment_id, external_reference, preference_id, resId, hasToken: !!idToken });

        if (resId) {
          info.resFetch = 'Iniciando busca da reserva...';
          setDebugInfo({ ...info });
          try {
            const res = await fetch(`https://locadj.onrender.com/api/reservations/${resId}`, { headers });
            info.resFetch = `Status: ${res.status}`;
            if (res.ok) {
              const resData = await res.json();
              info.resFetch += ` (Sucesso, ID: ${resData.id}, Status: ${resData.status})`;

              if (resData.paymentMethod) {
                setPaymentMethod(resData.paymentMethod);
              } else {
                setPaymentMethod('Mercado Pago');
              }

              if (resData.totalAmount) {
                setPaymentAmount(`R$ ${Number(resData.totalAmount).toFixed(2).replace('.', ',')}`);
              }

              // Busca a data de confirmação no log de status
              const confirmLog = (resData.statusLogs || []).find((l: any) => l.status === 'CONFIRMADA');
              if (confirmLog && confirmLog.date) {
                setPaymentDate(formatApprovedDate(confirmLog.date));
              } else {
                // Se ainda está pendente ou não tem log, mas o usuário acabou de pagar,
                // exibe a data atual como aprovação estimada (melhor UX do que "A definir")
                setPaymentDate(formatApprovedDate(new Date().toISOString()));
              }

              // Limpa o ID do storage após carregar com sucesso
              try {
                await AsyncStorage.removeItem('latest_checkout_reservation_id');
              } catch (clearErr) { }
            } else {
              const errText = await res.text().catch(() => '');
              info.resFetch += ` - Erro: ${errText.substring(0, 100)}`;
            }
          } catch (resErr: any) {
            info.resFetch = `Falha de rede: ${resErr.message}`;
          }
        } else {
          info.resFetch = 'Sem ID de reserva para buscar';
        }

        setDebugInfo({ ...info });

        // 2. Busca secundária de status de checkout (apenas para transações reais)
        if (payment_id && !payment_id.toString().startsWith('sim_mp_')) {
          const pId = String(payment_id).replace('sim_mp_', '');
          info.statusFetch = 'Iniciando busca de status...';
          setDebugInfo({ ...info });
          try {
            const res = await fetch(`https://locadj.onrender.com/api/checkout/status/${pId}`, { headers });
            info.statusFetch = `Status: ${res.status}`;
            if (res.ok) {
              const data = await res.json();
              info.statusFetch += ` (Sucesso, Metodo: ${data.paymentMethod || data.payment_method})`;

              const paymentMethodVal = data.paymentMethod || data.payment_method || data.payment_method_id || data.paymentMethodId;
              if (paymentMethodVal) {
                const type = String(paymentMethodVal).toLowerCase();
                const creditBrands = ['visa', 'master', 'mastercard', 'amex', 'elo', 'hipercard', 'diners', 'cabal', 'credit'];
                const debitBrands = ['maestro', 'visa_electron', 'debit'];

                if (creditBrands.some(b => type.includes(b))) {
                  setPaymentMethod(type === 'visa' || type === 'master' || type === 'amex' || type === 'elo'
                    ? `Cartão de Crédito (${type.charAt(0).toUpperCase() + type.slice(1)})`
                    : 'Cartão de Crédito');
                }
                else if (debitBrands.some(b => type.includes(b))) setPaymentMethod('Cartão de Débito');
                else if (type.includes('pix')) setPaymentMethod('Pix');
                else if (type.includes('ticket') || type.includes('boleto') || type.includes('bolbradesco') || type.includes('pec')) setPaymentMethod('Boleto');
                else if (type.includes('account_money')) setPaymentMethod('Saldo em Conta (MP)');
                else setPaymentMethod(paymentMethodVal);
              }

              const amountVal = data.amount || data.transaction_amount || data.transactionAmount;
              if (amountVal) {
                setPaymentAmount(`R$ ${Number(amountVal).toFixed(2).replace('.', ',')}`);
              }

              const paymentDateVal = data.paymentDate || data.payment_date || data.date_approved || data.dateApproved;
              if (paymentDateVal) {
                setPaymentDate(formatApprovedDate(paymentDateVal));
              }
            } else {
              const errText = await res.text().catch(() => '');
              info.statusFetch += ` - Erro: ${errText.substring(0, 100)}`;
            }
          } catch (statusErr: any) {
            info.statusFetch = `Falha de rede: ${statusErr.message}`;
          }
        } else if (payment_id && payment_id.toString().startsWith('sim_mp_')) {
          // Fallback para fluxos simulados
          setPaymentMethod('Saldo Mercado Pago');
          setPaymentDate(formatApprovedDate(new Date().toISOString()));
          info.statusFetch = 'Simulado';
        } else {
          info.statusFetch = 'Sem payment_id';
        }
      } catch (error: any) {
        console.error("Erro geral na busca de dados da tela de aprovado:", error);
        info.generalError = error.message;
      } finally {
        if (active) {
          setDebugInfo({ ...info });
          setLoading(false);
        }
      }
    }

    fetchApiData();

    return () => {
      active = false;
    };
  }, [authLoaded, currentUser, payment_id, external_reference, preference_id]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      <View style={[styles.headerBg, { height: height * 0.35 + insets.top }]}>
        <View style={styles.headerBgPattern} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>


        <Animated.View style={[styles.card, {
          opacity: fadeValue,
          transform: [{ translateY: slideUpValue }]
        }]}>


          <View style={styles.iconContainer}>
            <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleValue }] }]}>
              <Ionicons name="checkmark" size={48} color={TEXT_LIGHT} />
            </Animated.View>
          </View>

          <Text style={styles.title}>Pagamento Aprovado!</Text>
          <Text style={styles.subtitle}>Sua reserva foi confirmada e o kit já está garantido para o seu evento.</Text>


          <View style={styles.divider} />


          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={[styles.summaryValue, { color: SUCCESS }]}>Confirmado</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Forma de Pagamento</Text>
              <Text style={styles.summaryValue}>{paymentMethod}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Data de Aprovação</Text>
              <Text style={styles.summaryValue}>{paymentDate}</Text>
            </View>
            {paymentAmount && (
              <View style={[styles.summaryRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 16 }]}>
                <Text style={[styles.summaryLabel, { color: TEXT_LIGHT, fontWeight: '700' }]}>Valor Total Pago</Text>
                <Text style={[styles.summaryValue, { fontSize: 18, color: PRIMARY }]}>{paymentAmount}</Text>
              </View>
            )}


          </View>

        </Animated.View>

        <Animated.View style={[styles.actionContainer, {
          opacity: fadeValue,
          transform: [{ translateY: slideUpValue }]
        }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/reservations')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Ir para Meus Pedidos</Text>
            <Ionicons name="arrow-forward" size={20} color={PRIMARY} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/kits_list')}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryBtnText}>Voltar para o Início</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    overflow: 'hidden',
  },
  headerBgPattern: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    top: -width * 0.5,
    right: -width * 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    paddingTop: 56,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 32,
  },
  iconContainer: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: BG,
    shadowColor: SUCCESS,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_LIGHT,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 24,
  },
  summaryContainer: {
    width: '100%',
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: TEXT_LIGHT,
    fontWeight: '700',
  },
  actionContainer: {
    gap: 16,
    marginTop: 'auto',
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: TEXT_MUTED,
    fontSize: 15,
    fontWeight: '600',
  },
});
