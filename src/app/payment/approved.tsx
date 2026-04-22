import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const PRIMARY = '#5245F1';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F3F4F6';
const GRAY_400 = '#9CA3AF';
const GRAY_800 = '#1F2937';
const SUCCESS = '#10B981';

import { auth } from '../../config/firebaseConfig';

const { width, height } = Dimensions.get('window');

export default function PaymentApprovedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { payment_id, external_reference, preference_id } = useLocalSearchParams();

  const [paymentMethod, setPaymentMethod] = useState("A definir");
  const [reservationDate, setReservationDate] = useState("A definir");

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
    async function fetchApiData() {
      try {
        const currentUser = auth.currentUser;
        const idToken = currentUser ? await currentUser.getIdToken() : null;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        if (payment_id) {
          const res = await fetch(`https://locadj.onrender.com/api/checkout/status/${payment_id}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.payment_type_id || data.payment_method_id) {
              const type = (data.payment_type_id || data.payment_method_id).toLowerCase();
              if (type.includes('credit')) setPaymentMethod('Cartão de Crédito');
              else if (type.includes('debit')) setPaymentMethod('Cartão de Débito');
              else if (type.includes('pix')) setPaymentMethod('Pix');
              else if (type.includes('ticket') || type.includes('boleto')) setPaymentMethod('Boleto');
            }
          }
        }

        const resId = external_reference || preference_id;
        if (resId) {
          const res = await fetch(`https://locadj.onrender.com/api/checkout/reservation/${resId}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.startDate) {
              const dateObj = new Date(data.startDate);
              const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
              setReservationDate(formattedDate);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes da reserva ou pagamento:", error);
      }
    }

    fetchApiData();
  }, [payment_id, external_reference, preference_id]);

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
              <Ionicons name="checkmark" size={48} color={WHITE} />
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
              <Text style={styles.summaryLabel}>Método de Pagamento</Text>
              <Text style={styles.summaryValue}>{paymentMethod}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Data da Reserva</Text>
              <Text style={styles.summaryValue}>{reservationDate}</Text>
            </View>
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
            <Ionicons name="arrow-forward" size={20} color={WHITE} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/home')}
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
    backgroundColor: '#F4F5F7',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerBgPattern: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -width * 0.5,
    right: -width * 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    paddingTop: 56,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
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
    borderColor: '#F4F5F7',
    shadowColor: SUCCESS,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: GRAY_800,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: GRAY_400,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: GRAY_100,
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
    color: GRAY_400,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: GRAY_800,
    fontWeight: '700',
  },
  actionContainer: {
    gap: 16,
    marginTop: 'auto',
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: GRAY_800,
    fontSize: 15,
    fontWeight: '600',
  },
});
