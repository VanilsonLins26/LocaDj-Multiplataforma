import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const API_URL = 'https://locadj.onrender.com/api/kits';
const PRIMARY = '#5245F1';

interface Kit {
  id: number;
  name: string;
  description: string;
  pricePerDay: number;
  imageUrl: string;
  quantity: number;
  rents: number;
  availability: boolean;
}

function KitCard({ kit, onPress }: { kit: Kit; onPress: () => void }) {
  const formatPrice = (val: number) =>
    `R$ ${val.toFixed(2).replace('.', ',')}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        {kit.imageUrl ? (
          <Image source={{ uri: kit.imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="package" size={32} color="#C4BFFA" />
          </View>
        )}
        <View style={[styles.availBadge, { backgroundColor: kit.availability ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.availText}>{kit.availability ? 'Disponível' : 'Indisponível'}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>{kit.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{kit.description}</Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>Por dia</Text>
            <Text style={styles.priceValue}>{formatPrice(kit.pricePerDay)}</Text>
          </View>
          <View style={styles.statsRow}>
            <Feather name="box" size={13} color="#9CA3AF" />
            <Text style={styles.statText}>{kit.quantity} un.</Text>
            <Feather name="repeat" size={13} color="#9CA3AF" style={{ marginLeft: 10 }} />
            <Text style={styles.statText}>{kit.rents} loc.</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function KitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [kits, setKits] = useState<Kit[]>([]);
  const [filtered, setFiltered] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'unavailable'>('all');

  const fetchKits = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const resp = await fetch(API_URL);
      if (!resp.ok) throw new Error('Erro na resposta do servidor');
      const data: Kit[] = await resp.json();
      setKits(data);
      setFiltered(data);
    } catch (e) {
      setError('Não foi possível carregar os kits. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  useEffect(() => {
    let result = kits;
    if (filter === 'available') result = result.filter((k) => k.availability);
    if (filter === 'unavailable') result = result.filter((k) => !k.availability);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (k) => k.name.toLowerCase().includes(q) || k.description.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, filter, kits]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kits Disponíveis</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar kit..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
            <Feather name="x" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <View style={styles.filtersRow}>
        {(['all', 'available', 'unavailable'] as const).map((f) => {
          const labels = { all: 'Todos', available: 'Disponíveis', unavailable: 'Indisponíveis' };
          return (
            <TouchableOpacity
              key={f}
              style={[styles.pill, filter === f && styles.pillActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, filter === f && styles.pillTextActive]}>
                {labels[f]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Carregando kits...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={48} color="#C4BFFA" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchKits()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchKits(true)}
              colors={[PRIMARY]}
              tintColor={PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="package" size={48} color="#C4BFFA" />
              <Text style={styles.emptyText}>Nenhum kit encontrado</Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.countText}>
              {filtered.length} kit{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </Text>
          }
          renderItem={({ item }) => (
            <KitCard
              kit={item}
              onPress={() => router.push(`/kit/${item.id}` as never)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F9' },

  // Header
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1F2937', height: '100%' },

  // Filters
  filtersRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  pillActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  pillText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  pillTextActive: { color: '#FFF' },

  // List
  listContent: { paddingHorizontal: 20 },
  countText: { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },

  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  imageWrapper: { width: '100%', height: 180, backgroundColor: '#F3F4F6' },
  cardImage: { width: '100%', height: '100%' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  availBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  availText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  cardBody: { padding: 16 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  priceLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  priceValue: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },

  // States
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12 },
  loadingText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  errorText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 },
  emptyText: { fontSize: 15, color: '#9CA3AF' },
  retryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 100,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
});
