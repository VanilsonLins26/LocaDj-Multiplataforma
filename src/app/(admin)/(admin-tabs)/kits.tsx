import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../../config/firebaseConfig';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const BORDER_LIGHT = '#3F3F46';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';
const SUCCESS = '#10B981';
const WARNING = '#F59E0B';
const DANGER = '#EF4444';

const API_BASE = 'https://locadj.onrender.com/api';

interface Kit {
  id: number;
  name: string;
  description: string;
  pricePerDay: number;
  imageUrl?: string;
  quantity: number;
  rents: number;
  availability?: boolean;
  available?: boolean;
}

type FilterType = 'all' | 'available' | 'unavailable';

function KitCard({
  kit,
  onEdit,
  onDelete,
}: {
  kit: Kit;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formatPrice = (val: number) =>
    `R$ ${val.toFixed(2).replace('.', ',')}`;

  const isAvailable = kit.availability ?? kit.available ?? true;

  return (
    <View style={styles.card}>
      <View style={styles.cardImageWrap}>
        {kit.imageUrl ? (
          <Image
            source={{ uri: kit.imageUrl }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Feather name="package" size={28} color={BORDER_LIGHT} />
          </View>
        )}
        <View
          style={[
            styles.statusBadge,
            { borderColor: isAvailable ? SUCCESS : WARNING },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isAvailable ? SUCCESS : WARNING },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isAvailable ? SUCCESS : WARNING },
            ]}
          >
            {isAvailable ? 'Disponível' : 'Em manutenção'}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardInfo}>
          <Text style={styles.kitName} numberOfLines={1}>
            {kit.name}
          </Text>
          <Text style={styles.kitDesc} numberOfLines={2}>
            {kit.description}
          </Text>
          <View style={styles.kitMeta}>
            <View style={styles.metaRow}>
              <Feather name="dollar-sign" size={13} color={TEXT_MUTED} />
              <Text style={styles.metaText}>
                {formatPrice(kit.pricePerDay)}/dia
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="box" size={13} color={TEXT_MUTED} />
              <Text style={styles.metaText}>
                {kit.quantity} un.
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Feather name="repeat" size={13} color={TEXT_MUTED} />
              <Text style={styles.metaText}>
                {kit.rents} loc.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, styles.editIconWrap]}>
              <Feather name="edit-2" size={16} color={PRIMARY} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={onDelete}
            activeOpacity={0.8}
          >
            <View style={[styles.actionIconWrap, styles.deleteIconWrap]}>
              <Feather name="trash-2" size={16} color={DANGER} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function AdminKitsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [kits, setKits] = useState<Kit[]>([]);
  const [filtered, setFiltered] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchKits = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const headers = await getAuthHeader();
      const resp = await fetch(`${API_BASE}/kits`, { headers });
      if (!resp.ok) throw new Error('Erro na resposta do servidor');
      const data: Kit[] = await resp.json();
      setKits(data);
      setFiltered(data);
    } catch {
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
    const isAvail = (k: Kit) => k.availability ?? k.available ?? false;
    if (filter === 'available') result = result.filter(isAvail);
    if (filter === 'unavailable') result = result.filter((k) => !isAvail(k));
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (k) =>
          k.name.toLowerCase().includes(q) ||
          k.description.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, filter, kits]);

  const handleDelete = (kit: Kit) => {
    Alert.alert(
      'Excluir Kit',
      `Tem certeza que deseja excluir "${kit.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(kit.id);
            try {
              const headers = await getAuthHeader();
              const resp = await fetch(`${API_BASE}/kits/${kit.id}`, {
                method: 'DELETE',
                headers,
              });
              if (!resp.ok) throw new Error('Falha ao excluir');
              setKits((prev) => prev.filter((k) => k.id !== kit.id));
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir o kit. Tente novamente.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (kit: Kit) => {
    router.push({
      pathname: '/(admin)/admin-kit-form',
      params: { kitId: String(kit.id) },
    } as never);
  };

  const handleAdd = () => {
    router.push('/(admin)/admin-kit-form' as never);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'available', label: 'Disponíveis' },
    { key: 'unavailable', label: 'Em manutenção' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <Text style={styles.headerTitle}>Gerenciar Kits</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={16} color={TEXT_MUTED} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar kit..."
            placeholderTextColor={TEXT_MUTED}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Feather name="x" size={16} color={TEXT_MUTED} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter pills */}
      <View style={styles.filtersRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.pill, filter === f.key && styles.pillActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[styles.pillText, filter === f.key && styles.pillTextActive]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Carregando kits...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={48} color={BORDER_LIGHT} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchKits()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 90 },
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
              <Feather name="package" size={48} color={BORDER_LIGHT} />
              <Text style={styles.emptyText}>Nenhum kit encontrado</Text>
            </View>
          }
          ListHeaderComponent={
            <Text style={styles.countText}>
              {filtered.length} kit{filtered.length !== 1 ? 's' : ''} encontrados
            </Text>
          }
          renderItem={({ item }) => (
            <KitCard
              kit={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* FAB */}
      {!loading && !error && (
        <TouchableOpacity
          style={[
            styles.fab,
            { bottom: insets.bottom + 24 },
          ]}
          onPress={handleAdd}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={TEXT_LIGHT} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: TEXT_LIGHT,
    fontSize: 20,
    fontWeight: '700',
  },

  // Search
  searchWrapper: { paddingHorizontal: 20, paddingBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: TEXT_LIGHT, height: '100%' },

  // Filter pills
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
  },
  pillActive: { borderColor: PRIMARY },
  pillText: { fontSize: 13, fontWeight: '600', color: TEXT_MUTED },
  pillTextActive: { color: PRIMARY },

  // List
  listContent: { paddingHorizontal: 20 },
  countText: { fontSize: 13, color: TEXT_MUTED, marginBottom: 12 },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardImageWrap: {
    width: '100%',
    height: 100,
    backgroundColor: '#18181B',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardBody: {
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
    gap: 12,
  },
  cardInfo: { flex: 1 },
  kitName: { fontSize: 15, fontWeight: '700', color: TEXT_LIGHT, marginBottom: 4 },
  kitDesc: { fontSize: 13, color: TEXT_MUTED, lineHeight: 18, marginBottom: 12 },
  kitMeta: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, fontWeight: '500', color: TEXT_MUTED },

  // Actions
  cardActions: { flexDirection: 'row', gap: 8 },
  editBtn: {},
  deleteBtn: {},
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconWrap: { borderColor: PRIMARY },
  deleteIconWrap: { borderColor: DANGER },

  // States
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: TEXT_MUTED, marginTop: 8 },
  errorText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 15, color: TEXT_MUTED },
  retryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryBtnText: { color: TEXT_LIGHT, fontWeight: '600', fontSize: 14 },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
});
