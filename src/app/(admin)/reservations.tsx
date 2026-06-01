import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

const API_BASE = 'https://locadj.onrender.com/api';

interface Reservation {
  id: number;
  startDateTime: string;
  endDateTime: string;
  startDate?: string;
  endDate?: string;
  status: string;
  user: {
    name: string;
    email: string;
  };
  kit: {
    name: string;
    pricePerDay: number;
  };
}

export default function AdminReservationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(7);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('A_ENTREGAR');

  const fetchReservations = async (silent = false) => {
    const user = auth.currentUser;
    if (!user) return;

    if (!silent) setLoading(true);
    setError('');

    try {
      const token = await user.getIdToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      const resp = await fetch(`${API_BASE}/reservations/all`, { headers });
      if (!resp.ok) throw new Error('Erro ao buscar reservas');

      const data = await resp.json();
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar reservas:', err);
      if (!silent) setError('Não foi possível carregar as reservas.');
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        fetchReservations();
      } else {
        setReservations([]);
        setLoading(false);
        setRefreshing(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Quando a tela ganha foco (ao voltar de outra tela), atualiza os dados em background
      fetchReservations(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReservations(true);
  };

  const filteredReservations = reservations
    .filter(res => {
      // Filtro da Aba
      const status = res.status || 'PENDENTE';
      if (activeTab === 'PENDENTES') {
        if (status !== 'PENDENTE') return false;
      } else if (activeTab === 'A_ENTREGAR') {
        if (status !== 'CONFIRMADA') return false;
      } else if (activeTab === 'EM_USO') {
        if (status !== 'SAIU_PARA_ENTREGA' && status !== 'EM_ADAMENTO' && status !== 'IN_PROGRESS') return false;
      } else if (activeTab === 'HISTORICO') {
        if (status !== 'CONCLUIDA') return false;
      }

      // Filtro de Busca
      const q = searchQuery.toLowerCase();
      const userName = res.user?.name?.toLowerCase() || '';
      const userEmail = res.user?.email?.toLowerCase() || '';
      const kitName = res.kit?.name?.toLowerCase() || '';
      return userName.includes(q) || userEmail.includes(q) || kitName.includes(q);
    })
    .sort((a, b) => {
      // Ordenação Inteligente Baseada no Contexto Logístico
      if (activeTab === 'A_ENTREGAR') {
        // Urgência de Envio: Reservas que começam mais cedo aparecem primeiro (Crescente)
        const dateA = new Date(a.startDateTime || a.startDate || 0).getTime();
        const dateB = new Date(b.startDateTime || b.startDate || 0).getTime();
        return dateA - dateB;
      } else if (activeTab === 'EM_USO') {
        // Urgência de Coleta: Reservas que terminam mais cedo aparecem primeiro (Crescente)
        const dateA = new Date(a.endDateTime || a.endDate || 0).getTime();
        const dateB = new Date(b.endDateTime || b.endDate || 0).getTime();
        return dateA - dateB;
      }
      // Padrão (Todas, Pendentes, Histórico): Mais recentes no topo (Decrescente)
      return b.id - a.id;
    });

  const displayedReservations = filteredReservations.slice(0, visibleCount);

  const handleLoadMore = () => {
    if (visibleCount < filteredReservations.length && !loadingMore) {
      setLoadingMore(true);
      // Simula o tempo de rede para dar tempo do FlatList renderizar
      // e o usuário perceber o carregamento
      setTimeout(() => {
        setVisibleCount(prev => prev + 7);
        setLoadingMore(false);
      }, 800);
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '--/--/---- --:--';
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) return isoString;
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    const hs = String(dateObj.getHours()).padStart(2, '0');
    const ms = String(dateObj.getMinutes()).padStart(2, '0');
    return `${d}/${m}/${y} ${hs}:${ms}`;
  };

  const renderItem = ({ item }: { item: Reservation }) => {
    const userName = item.user?.name || 'Usuário';
    const userEmail = item.user?.email || 'Sem e-mail';
    const kitName = item.kit?.name || 'Kit sem nome';
    const price = item.kit?.pricePerDay ? item.kit.pricePerDay.toFixed(2) : '0.00';

    const currentStatus = item.status || 'PENDENTE';
    let statusText = currentStatus;
    let statusColor = '#9CA3AF';
    let statusBg = 'transparent';

    switch (currentStatus) {
      case 'PENDENTE':
        statusText = 'Pendente';
        statusColor = '#F59E0B'; // Laranja
        statusBg = 'rgba(245, 158, 11, 0.1)';
        break;
      case 'CONFIRMADA':
        statusText = 'Confirmada';
        statusColor = '#3B82F6'; // Azul
        statusBg = 'rgba(59, 130, 246, 0.1)';
        break;
      case 'SAIU_PARA_ENTREGA':
        statusText = 'Saiu p/ Entrega';
        statusColor = '#8B5CF6'; // Roxo
        statusBg = 'rgba(139, 92, 246, 0.1)';
        break;
      case 'EM_ADAMENTO':
      case 'IN_PROGRESS':
        statusText = 'Em Andamento';
        statusColor = '#EF4444'; // Rosa/Vermelho
        statusBg = 'rgba(239, 68, 68, 0.1)';
        break;
      case 'CONCLUIDA':
        statusText = 'Concluída';
        statusColor = '#10B981'; // Verde
        statusBg = 'rgba(16, 185, 129, 0.1)';
        break;
    }

    return (
      <View style={styles.card}>
        {/* User Info */}
        <View style={styles.userInfoRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color={PRIMARY} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userEmail}>{userEmail}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor, borderWidth: 1 }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Kit & Reservation Info */}
        <View style={styles.kitInfoRow}>
          <View style={styles.kitDetails}>
            <Text style={styles.kitName} numberOfLines={1}>{kitName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>R$ {price}</Text>
              <Text style={styles.priceUnit}>/dia</Text>
            </View>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.dateInfo}>
            <Text style={styles.dateText}>{formatDateTime(item.startDateTime)}</Text>
            <Text style={styles.dateText}>{formatDateTime(item.endDateTime)}</Text>
          </View>

          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={() => router.push(`/(admin)/admin-reservation/${item.id}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsBtnText}>Detalhes</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>Todas as Reservas</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={TEXT_MUTED} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar reservas..."
            placeholderTextColor={TEXT_MUTED}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setVisibleCount(7);
            }}
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'A_ENTREGAR' && styles.tabBtnActive]} onPress={() => { setActiveTab('A_ENTREGAR'); setVisibleCount(7); }}>
            <Text style={[styles.tabText, activeTab === 'A_ENTREGAR' && styles.tabTextActive]}>A Entregar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'EM_USO' && styles.tabBtnActive]} onPress={() => { setActiveTab('EM_USO'); setVisibleCount(7); }}>
            <Text style={[styles.tabText, activeTab === 'EM_USO' && styles.tabTextActive]}>Em Uso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'HISTORICO' && styles.tabBtnActive]} onPress={() => { setActiveTab('HISTORICO'); setVisibleCount(7); }}>
            <Text style={[styles.tabText, activeTab === 'HISTORICO' && styles.tabTextActive]}>Histórico</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'PENDENTES' && styles.tabBtnActive]} onPress={() => { setActiveTab('PENDENTES'); setVisibleCount(7); }}>
            <Text style={[styles.tabText, activeTab === 'PENDENTES' && styles.tabTextActive]}>Pendentes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tabBtn, activeTab === 'ALL' && styles.tabBtnActive]} onPress={() => { setActiveTab('ALL'); setVisibleCount(7); }}>
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>Todas</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color={TEXT_MUTED} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchReservations()}>
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedReservations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={PRIMARY} style={{ marginVertical: 20 }} />
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} tintColor={PRIMARY} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={60} color={TEXT_MUTED} />
              <Text style={styles.emptyText}>Nenhuma reserva encontrada.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  searchWrapper: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_LIGHT,
    height: '100%',
  },
  tabsWrapper: {
    marginBottom: 12,
  },
  tabsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabBtnActive: {
    borderColor: PRIMARY,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  tabTextActive: {
    color: PRIMARY,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginVertical: 14,
  },
  kitInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kitDetails: {
    flex: 1,
  },
  kitName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#10B981',
  },
  priceUnit: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: BORDER,
    marginHorizontal: 12,
  },
  dateInfo: {
    flex: 1.2,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  detailsBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  detailsBtnText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 15,
    color: TEXT_MUTED,
    marginTop: 12,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: TEXT_LIGHT,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: TEXT_MUTED,
  },
});
