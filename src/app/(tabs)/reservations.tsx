import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebaseConfig';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRIMARY = '#5B42F3';
const BG = '#F4F5F7';

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
      
      const listResp = await fetch(BASE_URL, { headers });
      let allData: any[] = [];
      
      if (listResp.ok) {
        const json = await listResp.json();
        allData = Array.isArray(json) ? json : (json.value ?? []);
      }

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

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [fetchReservations])
  );

  const renderBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDENTE') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.badgeText, { color: '#B45309' }]}>Pendente</Text>
        </View>
      );
    }
    if (s === 'CONFIRMADA' || s === 'CONCLUIDA') {
      return (
        <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.badgeText, { color: '#065F46' }]}>
            {s === 'CONCLUIDA' ? 'Concluída' : 'Confirmada'}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
        <Text style={[styles.badgeText, { color: '#1D4ED8' }]}>{s.replace('_', ' ')}</Text>
      </View>
    );
  };

  const formatVisibleDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    
    const str = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const dateObj = new Date(str);
    
    if (isNaN(dateObj.getTime())) return isoString;
    
    // Converte para Horário de Brasília (UTC-3)
    const brtDate = new Date(dateObj.getTime() - (3 * 60 * 60 * 1000));
    
    const d = String(brtDate.getUTCDate()).padStart(2, '0');
    const m = String(brtDate.getUTCMonth() + 1).padStart(2, '0');
    const y = brtDate.getUTCFullYear();
    
    return `${d}/${m}/${y}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const kitName = item.kit?.name || item.kitName || 'Kit sem nome';
    const userName = item.user?.name || auth.currentUser?.displayName || 'Usuário';
    const startDate = item.startDateTime ? formatVisibleDate(item.startDateTime) : (item.startDate || '--/--/----');
    const endDate = item.endDateTime ? formatVisibleDate(item.endDateTime) : (item.endDate || '--/--/----');
    const price = item.totalAmount ? `R$ ${item.totalAmount.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
    const daily = item.daily || 1;
    const imageUrl = item.kit?.imageUrl;

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.9} 
        onPress={() => router.push(`/reservation/${item.id}`)}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color="#9CA3AF" />
            </View>
          )}
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.kitName} numberOfLines={1}>{kitName}</Text>
            {renderBadge(item.status || 'PENDENTE')}
          </View>
          
          <View style={styles.userRow}>
            <Ionicons name="person-outline" size={14} color="#9CA3AF" />
            <Text style={styles.userName}>{userName.toUpperCase()}</Text>
          </View>

          <View style={styles.datesBox}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>INÍCIO</Text>
              <Text style={styles.dateValue}>{startDate}</Text>
            </View>
            <Feather name="arrow-right" size={16} color="#9CA3AF" />
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>FIM</Text>
              <Text style={styles.dateValue}>{endDate}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.durationBadge}>
              <Feather name="clock" size={12} color="#5B42F3" />
              <Text style={styles.durationText}>{daily} {daily > 1 ? 'dias' : 'dia'}</Text>
            </View>
            <Text style={styles.priceText}>{price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <Text style={styles.headerTitle}>Minhas Reservas</Text>
        <Text style={styles.headerSubtitle}>{reservations.length} registros</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(item) => String(item.id)}
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
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cardBody: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kitName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  datesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B42F3',
    marginLeft: 6,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
});

