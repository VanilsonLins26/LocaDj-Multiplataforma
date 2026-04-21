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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY = '#5B4EE4';
const GRAY_100 = '#F3F4F6';
const GRAY_200 = '#E5E7EB';
const GRAY_500 = '#6B7280';
const GRAY_900 = '#111827';
const API_URL = 'https://locadj.onrender.com/api/kits';

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

type FilterType = 'Todos' | 'Disponíveis' | 'Mais populares';

export default function KitsListScreen() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const fetchKits = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erro no servidor');
      const data = await response.json();
      setKits(Array.isArray(data) ? data : data.value ?? []);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os kits. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const filteredKits = kits
    .filter((k) => {
      if (activeFilter === 'Disponíveis') return k.availability;
      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'Mais populares') return (b.rents || 0) - (a.rents || 0);
      return 0;
    })
    .filter((k) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return k.name.toLowerCase().includes(q) || k.description.toLowerCase().includes(q);
    });

  const renderFilter = (label: FilterType) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        key={label}
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(label)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderKit = ({ item }: { item: Kit }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => router.push({ pathname: '/kit/[id]', params: { id: item.id } })}
    >
      <View style={styles.imageContainer}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={40} color={GRAY_200} />
          </View>
        )}
        <View style={[styles.availBadge, { backgroundColor: item.availability ? '#10B981' : '#EF4444' }]}>
          <Text style={styles.availText}>{item.availability ? 'Disponível' : 'Indisponível'}</Text>
        </View>
      </View>

      <View style={styles.cardHeader}>
        <Text style={styles.kitName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.kitPrice}>{formatCurrency(item.pricePerDay)}/dia</Text>
      </View>

      <Text style={styles.kitDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.statsRow}>
          <Ionicons name="cube-outline" size={14} color={GRAY_500} />
          <Text style={styles.statText}>{item.quantity} un.</Text>
          <Ionicons name="repeat-outline" size={14} color={GRAY_500} style={{ marginLeft: 12 }} />
          <Text style={styles.statText}>{item.rents} loc.</Text>
        </View>
        <TouchableOpacity
          style={styles.btnReservar}
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/kit/[id]', params: { id: item.id } })}
        >
          <Text style={styles.btnReservarText}>+ Reservar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: PRIMARY }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: 16 }]}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Catálogo de Kits</Text>
            <Text style={styles.headerCount}>{kits.length} kits</Text>
          </View>
          {/* Search */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar kit..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Filters */}
          <View style={styles.filtersRow}>
            {(['Todos', 'Disponíveis', 'Mais populares'] as FilterType[]).map(renderFilter)}
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Carregando kits...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Ionicons name="wifi-outline" size={40} color={GRAY_500} style={{ marginBottom: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchKits()} style={styles.btnRetry}>
                <Text style={styles.btnRetryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredKits}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderKit}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchKits(true)}
                  colors={[PRIMARY]}
                  tintColor={PRIMARY}
                />
              }
              ListHeaderComponent={
                <Text style={styles.countText}>
                  {filteredKits.length} kit{filteredKits.length !== 1 ? 's' : ''} encontrado{filteredKits.length !== 1 ? 's' : ''}
                </Text>
              }
              ListEmptyComponent={
                <View style={styles.centerBox}>
                  <Ionicons name="cube-outline" size={40} color={GRAY_500} style={{ marginBottom: 8 }} />
                  <Text style={styles.errorText}>Nenhum kit encontrado</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: PRIMARY,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerCount: { fontSize: 13, color: '#E0E7FF', fontWeight: '500' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: GRAY_900 },
  content: { flex: 1 },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GRAY_200,
    backgroundColor: '#FFF',
  },
  filterChipActive: { borderColor: PRIMARY, backgroundColor: '#EEF2FF' },
  filterText: { fontSize: 13, color: GRAY_500, fontWeight: '500' },
  filterTextActive: { color: PRIMARY, fontWeight: '600' },
  countText: { fontSize: 12, color: GRAY_500, marginBottom: 8, marginLeft: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: GRAY_100,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: GRAY_100,
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
  },
  imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  availBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  availText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  kitName: { fontSize: 16, fontWeight: '700', color: GRAY_900, flex: 1, paddingRight: 8 },
  kitPrice: { fontSize: 15, fontWeight: '700', color: PRIMARY },
  kitDesc: { fontSize: 13, color: GRAY_500, marginBottom: 14, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: GRAY_500, marginRight: 4 },
  btnReservar: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnReservarText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 40 },
  loadingText: { fontSize: 14, color: GRAY_500, marginTop: 12 },
  errorText: { fontSize: 14, color: GRAY_500, textAlign: 'center', marginBottom: 16 },
  btnRetry: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: PRIMARY,
    borderRadius: 10,
  },
  btnRetryText: { color: '#fff', fontWeight: '600' },
});