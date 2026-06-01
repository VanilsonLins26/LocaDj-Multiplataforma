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
import { useIsLandscape } from '../../hooks/useIsLandscape';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

export default function ReservationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLandscape } = useIsLandscape();
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
        <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#FBBF24' }]}>
          <Text style={[styles.badgeText, { color: '#FBBF24' }]}>Pendente</Text>
        </View>
      );
    }
    if (s === 'CONFIRMADA' || s === 'CONCLUIDA') {
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}>
          <Text style={[styles.badgeText, { color: '#10B981' }]}>
            {s === 'CONCLUIDA' ? 'Concluída' : 'Confirmada'}
          </Text>
        </View>
      );
    }
    if (s === 'CANCELADA') {
      return (
        <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
          <Text style={[styles.badgeText, { color: '#EF4444' }]}>Cancelada</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }]}>
        <Text style={[styles.badgeText, { color: '#3B82F6' }]}>{s.replace('_', ' ')}</Text>
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
              <Ionicons name="image-outline" size={32} color={BORDER} />
            </View>
          )}
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={styles.kitName} numberOfLines={1}>{kitName}</Text>
            {renderBadge(item.status || 'PENDENTE')}
          </View>
          
          <View style={styles.userRow}>
            <Ionicons name="person-outline" size={14} color={TEXT_MUTED} />
            <Text style={styles.userName}>{userName.toUpperCase()}</Text>
          </View>

          <View style={styles.datesBox}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>INÍCIO</Text>
              <Text style={styles.dateValue}>{startDate}</Text>
            </View>
            <Feather name="arrow-right" size={16} color={TEXT_MUTED} />
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>FIM</Text>
              <Text style={styles.dateValue}>{endDate}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.durationBadge}>
              <Feather name="clock" size={12} color={PRIMARY} />
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
      <View style={[styles.header, { paddingTop: isLandscape ? Math.max(insets.top, 12) + 4 : Math.max(insets.top, 20) + 12, paddingBottom: isLandscape ? 12 : 24 }]}>
        <Text style={[styles.headerTitle, isLandscape && { fontSize: 18 }]}>Minhas Reservas</Text>
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
              <Ionicons name="calendar-clear-outline" size={64} color={TEXT_MUTED} />
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: PRIMARY,
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
    color: TEXT_LIGHT,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyBtnText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#18181B',
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
    backgroundColor: '#18181B',
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
    color: TEXT_LIGHT,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
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
    color: TEXT_MUTED,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  datesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: TEXT_LIGHT,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
    marginLeft: 6,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: TEXT_LIGHT,
  },
});

