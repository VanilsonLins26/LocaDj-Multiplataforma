import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { auth } from '../../config/firebaseConfig';
import { useIsLandscape } from '../../hooks/useIsLandscape';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';
const API_URL = 'https://locadj.onrender.com/api/kits';

interface Kit {
  id: number;
  name: string;
  description: string;
  pricePerDay: number;
  imageUrl: string;
  quantity: number;
  rents: number;
  availability?: boolean;
  available?: boolean;
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
  const { isLandscape } = useIsLandscape();

  const fetchKits = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const response = await fetch(API_URL, { headers });
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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // Assim que o Firebase terminar de checar o storage local e se achar o user, a gente joga a requisição!
      // Se não achar (ainda carregando ou deslogado), tenta também, e a API vai recusar (com 401).
      fetchKits();
    });
    return unsubscribe;
  }, [fetchKits]);

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  const filteredKits = kits
    .filter((k) => {
      const isConfigAvailable = k.quantity > 0;
      if (activeFilter === 'Disponíveis') return isConfigAvailable;
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
            <Ionicons name="image-outline" size={40} color={BORDER} />
          </View>
        )}
        <View style={[styles.availBadge, { backgroundColor: item.quantity > 0 ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)' }]}>
          <Text style={styles.availText}>{item.quantity > 0 ? 'Disponível' : 'Indisponível'}</Text>
        </View>
      </View>

      <View style={styles.cardHeader}>
        <Text style={styles.kitName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.kitPrice}>{formatCurrency(item.pricePerDay)}/dia</Text>
      </View>

      <Text style={styles.kitDesc} numberOfLines={2}>{item.description}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.statsRow}>
          <Ionicons name="cube-outline" size={14} color={TEXT_MUTED} />
          <Text style={styles.statText}>{item.quantity} un.</Text>
          <Ionicons name="repeat-outline" size={14} color={TEXT_MUTED} style={{ marginLeft: 12 }} />
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: BG }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: isLandscape ? 8 : 16, paddingBottom: isLandscape ? 12 : 20 }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.headerTitle, isLandscape && { fontSize: 18 }]}>Catálogo de Kits</Text>
            <Text style={styles.headerCount}>{kits.length} kits</Text>
          </View>
          {/* Search */}
          <View style={[styles.searchBox, isLandscape && { height: 38 }]}>
            <Ionicons name="search-outline" size={16} color={TEXT_MUTED} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar kit..."
              placeholderTextColor={TEXT_MUTED}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={TEXT_MUTED} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {/* Filters */}
          <View style={[styles.filtersRow, isLandscape && { marginTop: 8, marginBottom: 4 }]}>
            {(['Todos', 'Disponíveis', 'Mais populares'] as FilterType[]).map(renderFilter)}
          </View>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={PRIMARY} />
              <Text style={styles.loadingText}>Carregando kits...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Ionicons name="wifi-outline" size={40} color={TEXT_MUTED} style={{ marginBottom: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchKits()} style={styles.btnRetry}>
                <Text style={styles.btnRetryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              key={isLandscape ? 'landscape-2col' : 'portrait-1col'}
              data={filteredKits}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => (
                <View style={isLandscape ? {
                  flex: 1,
                  marginLeft: index % 2 === 0 ? 0 : 8,
                  marginRight: index % 2 === 0 ? 8 : 0,
                } : undefined}>
                  {renderKit({ item })}
                </View>
              )}
              numColumns={isLandscape ? 2 : 1}
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
                  <Ionicons name="cube-outline" size={40} color={TEXT_MUTED} style={{ marginBottom: 8 }} />
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
  container: { flex: 1, backgroundColor: BG },
  header: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: TEXT_LIGHT },
  headerCount: { fontSize: 13, color: PRIMARY, fontWeight: '500' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: TEXT_LIGHT },
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
    borderColor: BORDER,
    backgroundColor: CARD_BG,
  },
  filterChipActive: { borderColor: PRIMARY, backgroundColor: 'rgba(139, 92, 246, 0.15)' },
  filterText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
  filterTextActive: { color: PRIMARY, fontWeight: '600' },
  countText: { fontSize: 12, color: TEXT_MUTED, marginBottom: 8, marginLeft: 20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },
  card: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#18181B',
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
  kitName: { fontSize: 16, fontWeight: '700', color: TEXT_LIGHT, flex: 1, paddingRight: 8 },
  kitPrice: { fontSize: 15, fontWeight: '700', color: PRIMARY },
  kitDesc: { fontSize: 13, color: TEXT_MUTED, marginBottom: 14, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: TEXT_MUTED, marginRight: 4 },
  btnReservar: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnReservarText: { color: PRIMARY, fontSize: 13, fontWeight: '600' },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, marginTop: 40 },
  loadingText: { fontSize: 14, color: TEXT_MUTED, marginTop: 12 },
  errorText: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', marginBottom: 16 },
  btnRetry: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 10,
  },
  btnRetryText: { color: PRIMARY, fontWeight: '600' },
});