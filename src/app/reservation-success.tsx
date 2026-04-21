import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const PRIMARY = '#5245F1';

export default function ReservationSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kitName, startDate, endDate, total, days } = useLocalSearchParams<{
    kitName: string;
    startDate: string;
    endDate: string;
    total: string;
    days: string;
  }>();

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const handleFinish = () => {
    router.replace('/(tabs)/kits_list');
  };

  const handleViewReservations = () => {
    router.replace('/(tabs)/reservations');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <Text style={styles.headerTitle}>Reserva Realizada</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Success icon */}
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <Feather name="check" size={48} color="#FFF" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.successTitle}>Reserva Confirmada!</Text>
          <Text style={styles.successSub}>
            Seu kit foi reservado com sucesso. Confira os detalhes abaixo.
          </Text>

          {/* Details card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{kitName || 'Kit'}</Text>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather name="calendar" size={15} color={PRIMARY} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Período</Text>
                <Text style={styles.detailValue}>
                  {startDate} → {endDate}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Feather name="clock" size={15} color={PRIMARY} />
              </View>
              <View>
                <Text style={styles.detailLabel}>Duração</Text>
                <Text style={styles.detailValue}>
                  {days} dia{Number(days) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{total}</Text>
            </View>
          </View>

          {/* Security badge */}
          <View style={styles.securityBadge}>
            <Feather name="shield" size={14} color="#10B981" />
            <Text style={styles.securityText}>Reserva protegida · LocaDJ</Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={styles.btnPrimary}
          activeOpacity={0.85}
          onPress={handleViewReservations}
        >
          <Feather name="list" size={18} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.btnPrimaryText}>Ver Minhas Reservas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          activeOpacity={0.8}
          onPress={handleFinish}
        >
          <Text style={styles.btnSecondaryText}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F9' },

  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  iconWrapper: {
    marginBottom: 28,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },

  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 14 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2, fontWeight: '600' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#374151' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalValue: { fontSize: 22, fontWeight: '800', color: PRIMARY },

  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityText: { fontSize: 12, fontWeight: '600', color: '#065F46' },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  btnSecondary: {
    borderRadius: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
});
