import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebaseConfig';

const PRIMARY = '#5B42F3';
const BG = '#F4F4F5';

interface ReservationKit {
  id: number;
  name: string;
  pricePerDay: number;
  imageUrl: string;
}

interface Reservation {
  id: number;
  user: { id: number; name: string; email: string } | null;
  kit: ReservationKit;
  startDateTime: string;
  endDateTime: string;
  daily: number;
  totalAmount: number;
  status: string | null;
}

function formatDate(isoStr: string): string {
  if (!isoStr) return '--';
  const [datePart] = isoStr.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
}

function calcDays(start: string, end: string): number {
  const diff = Math.ceil(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  );
  return diff > 0 ? diff : 1;
}

function formatCurrency(val: number): string {
  return `R$ ${val.toFixed(2).replace('.', ',')}`;
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
        <Text style={[styles.badgeText, { color: '#92400E' }]}>Pendente</Text>
      </View>
    );
  }
  const upper = status.toUpperCase();
  if (upper === 'CONFIRMED' || upper === 'CONFIRMADA') {
    return (
      <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
        <Text style={[styles.badgeText, { color: '#065F46' }]}>Confirmada</Text>
      </View>
    );
  }
  if (upper === 'CANCELLED' || upper === 'CANCELADA') {
    return (
      <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
        <Text style={[styles.badgeText, { color: '#991B1B' }]}>Cancelada</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
      <Text style={[styles.badgeText, { color: '#92400E' }]}>{status}</Text>
    </View>
  );
}

export default function ReservationsScreen() {
  const insets = useSafeAreaInsets();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchReservations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    const currentUserEmail = auth.currentUser?.email?.toLowerCase();

    if (!currentUserEmail) {
      setReservations([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const BASE = 'https://locadj.onrender.com/api/reservations';
      const ids = Array.from({ length: 20 }, (_, i) => i + 1);

      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`${BASE}/${id}`).then((r) => {
            if (!r.ok) throw new Error('not found');
            return r.json() as Promise<Reservation>;
          })
        )
      );

      const data = results
        .filter((r): r is PromiseFulfilledResult<Reservation> => r.status === 'fulfilled')
        .map((r) => r.value)
        .filter(
          (item): item is Reservation => 
            item != null && 
            typeof item?.id === 'number' && 
            item.user?.email?.toLowerCase() === currentUserEmail
        );

      setReservations(data);
    } catch (_) {
      setError('Não foi possível carregar as reservas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const renderItem = ({ item }: { item: Reservation }) => {
    const days = calcDays(item.startDateTime, item.endDateTime);
    const total = item.totalAmount > 0 ? item.totalAmount : item.kit.pricePerDay * days;

    return (
      <View style={styles.card}>
        {/* Imagem do kit */}
        <View style={styles.imageWrapper}>
          {item.kit.imageUrl ? (
            <Image source={{ uri: item.kit.imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="cube-outline" size={28} color="#C4BFFA" />
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          {/* Header: nome + status */}
          <View style={styles.cardHeader}>
            <Text style={styles.kitName} numberOfLines={1}>{item.kit.name}</Text>
            <StatusBadge status={item.status} />
          </View>

          {/* Datas */}
          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>INÍCIO</Text>
              <Text style={styles.dateValue}>{formatDate(item.startDateTime)}</Text>
            </View>
            <View style={styles.dateDivider}>
              <Feather name="arrow-right" size={14} color="#9CA3AF" />
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>FIM</Text>
              <Text style={styles.dateValue}>{formatDate(item.endDateTime)}</Text>
            </View>
          </View>

          {/* Rodapé: dias + total */}
          <View style={styles.cardFooter}>
            <View style={styles.daysTag}>
              <Feather name="clock" size={12} color={PRIMARY} />
              <Text style={styles.daysText}>{days} dia{days !== 1 ? 's' : ''}</Text>
            </View>
            <Text style={styles.totalText}>{formatCurrency(total)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <Text style={styles.headerTitle}>Minhas Reservas</Text>
        <Text style={styles.headerSub}>{reservations.length} registro{reservations.length !== 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Carregando reservas...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="wifi-outline" size={44} color="#C4BFFA" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchReservations()}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchReservations(true)}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="calendar-outline" size={44} color="#C4BFFA" />
              <Text style={styles.emptyText}>Nenhuma reserva encontrada</Text>
              <Text style={styles.emptyHint}>
                Reserve um kit e ele aparecerá aqui.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 13, color: '#E0E7FF', marginTop: 2 },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  loadingText: { fontSize: 14, color: '#9CA3AF' },
  errorText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  emptyHint: { fontSize: 13, color: '#C4BFFA', textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  listContent: { padding: 16 },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  imageWrapper: { width: '100%', height: 140, backgroundColor: '#F3F4F6' },
  cardImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  cardBody: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kitName: { fontSize: 15, fontWeight: '700', color: '#1F2937', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  dateCol: { flex: 1 },
  dateDivider: { paddingHorizontal: 8 },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#374151' },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  daysTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  daysText: { fontSize: 12, fontWeight: '600', color: PRIMARY },
  totalText: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
});
