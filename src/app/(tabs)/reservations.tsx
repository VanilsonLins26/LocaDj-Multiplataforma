import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebaseConfig';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#5B42F3';
const BG = '#F4F4F5';

export default function ReservationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchReservations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    const currentUser = auth.currentUser;
    const currentUserEmail = currentUser?.email?.toLowerCase();

    if (!currentUserEmail) {
      setReservations([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      };

      const BASE_URL = 'https://locadj.onrender.com/api/reservations';
      
      // 1. Tentar buscar a coleção total
      const listResp = await fetch(BASE_URL, { headers });
      let allData: any[] = [];
      
      if (listResp.ok) {
        const json = await listResp.json();
        allData = Array.isArray(json) ? json : (json.value ?? []);
      }

      // 2. Fallback / Complemento: buscar IDs específicos salvos no AsyncStorage
      const storedIdsStr = await AsyncStorage.getItem('my_reservation_ids');
      const storedIds: number[] = storedIdsStr ? JSON.parse(storedIdsStr) : [];
      
      const existingIds = new Set(allData.map(r => r.id));
      const missingIds = storedIds.filter(id => !existingIds.has(id));

      if (missingIds.length > 0) {
        const results = await Promise.allSettled(
          missingIds.map((id) =>
            fetch(`${BASE_URL}/${id}`, { headers }).then((r) => {
              if (!r.ok) throw new Error('not found');
              return r.json();
            })
          )
        );

        results.forEach(res => {
          if (res.status === 'fulfilled' && res.value) {
            allData.push(res.value);
          }
        });
      }

      // Filtragem final e ordenação
      const finalData = allData
        .filter((item, index, self) => 
          item != null && 
          item.user?.email?.toLowerCase() === currentUserEmail &&
          self.findIndex(t => t.id === item.id) === index
        )
        .sort((a, b) => b.id - a.id);

      setReservations(finalData);
    } catch (err) {
      console.error("Erro ao carregar reservas:", err);
      setError('Não foi possível carregar as reservas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  const renderBadge = (status: string) => {
    if (status.toLowerCase().includes('confirmada')) {
      return (
        <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.badgeText, { color: '#065F46' }]}>Confirmada</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
        <Text style={[styles.badgeText, { color: '#92400E' }]}>Pendente {'>'}</Text>
      </View>
    );
  };

  const formatVisibleDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    const split = isoString.split('T');
    if (split.length > 0) {
       const datePart = split[0];
       const parts = datePart.split('-');
       if (parts.length === 3) {
         const [y, m, d] = parts;
         return `${d}/${m}/${y}`;
       }
    }
    return isoString;
  };

  const renderItem = ({ item }: { item: any }) => {
    const kitName = item.kit?.name || item.kitName || 'Kit sem nome';
    const startDate = item.startDateTime ? formatVisibleDate(item.startDateTime) : (item.startDate || '--/--/----');
    const endDate = item.endDateTime ? formatVisibleDate(item.endDateTime) : (item.endDate || '--/--/----');

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardHeader}>
            <Text style={styles.kitName}>{kitName}</Text>
            {renderBadge(item.status || 'Pendente')}
          </View>

          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>INÍCIO</Text>
              <Text style={styles.dateValue}>{startDate}</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>FIM</Text>
              <Text style={styles.dateValue}>{endDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8}>
            <Feather name="x-circle" size={14} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Reservas</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-clear-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Nenhuma reserva ainda</Text>
              <Text style={styles.emptySubtitle}>
                Parece que você ainda não alugou nenhum equipamento com a gente.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/kits_list')}
              >
                <Text style={styles.emptyBtnText}>Explorar Catálogo</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardTop: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  kitName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  dateCol: {
    width: '45%',
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 13,
    color: '#4B5563',
  },
  cardBottom: {
    padding: 12,
    alignItems: 'flex-end',
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cancelBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
