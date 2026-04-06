import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const PRIMARY = '#5B4EE4';
const GRAY_100 = '#F3F4F6';
const GRAY_200 = '#E5E7EB';
const GRAY_500 = '#6B7280';
const GRAY_900 = '#111827';

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

export default function KitsListScreen() {
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    fetchKits();
  }, []);

  const fetchKits = async () => {
    try {
      const response = await fetch('https://locadj.onrender.com/api/kits');
      const data = await response.json();
      if (data && data.value) {
        setKits(data.value);
      } else if (Array.isArray(data)) {
        setKits(data);
      } else {
        setKits([]);
      }
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os kits.');
    } finally {
      setLoading(false);
    }
  };

  const renderFilter = (label: string) => {
    const isActive = activeFilter === label;
    return (
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={() => setActiveFilter(label)}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderKit = ({ item }: { item: Kit }) => {
    const formatCurrency = (val: number) => {
      return `R$ ${val.toFixed(2).replace('.', ',')}/dia`;
    };

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={GRAY_200} />
            </View>
          )}
        </View>

        <View style={styles.cardHeader}>
          <Text style={styles.kitName}>{item.name}</Text>
          <Text style={styles.kitPrice}>{formatCurrency(item.pricePerDay)}</Text>
        </View>

        <Text style={styles.kitDesc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.stockText}>{item.quantity} disponíveis</Text>
          <TouchableOpacity style={styles.btnReservar} activeOpacity={0.85}>
            <Text style={styles.btnReservarText}>+ Reservar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header com fundo azul */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Catálogo de Kits</Text>
          <Text style={styles.headerCount}>{kits.length} kits disponíveis</Text>
        </View>
      </View>

      {/* Conteúdo rolável */}
      <View style={styles.content}>
        <View style={styles.filtersRow}>
          {renderFilter('Todos')}
          {renderFilter('Mais populares')}
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={PRIMARY} />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={32} color={GRAY_500} style={{ marginBottom: 8 }} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchKits} style={styles.btnRetry}>
              <Text style={styles.btnRetryText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={kits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderKit}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  header: {
    backgroundColor: PRIMARY,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFF',
  },
  headerCount: {
    fontSize: 13,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GRAY_200,
    backgroundColor: '#FFF',
  },
  filterChipActive: {
    borderColor: PRIMARY,
    backgroundColor: '#EEF2FF',
  },
  filterText: {
    fontSize: 14,
    color: GRAY_500,
    fontWeight: '500',
  },
  filterTextActive: {
    color: PRIMARY,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: GRAY_100,
    borderRadius: 20,
    padding: 16,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: GRAY_100,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  kitName: {
    fontSize: 18,
    fontWeight: '700',
    color: GRAY_900,
    flex: 1,
    paddingRight: 8,
  },
  kitPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: PRIMARY,
  },
  kitDesc: {
    fontSize: 14,
    color: GRAY_500,
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stockText: {
    fontSize: 13,
    color: GRAY_500,
  },
  btnReservar: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnReservarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: GRAY_500,
    textAlign: 'center',
    marginBottom: 16,
  },
  btnRetry: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: PRIMARY,
    borderRadius: 8,
  },
  btnRetryText: {
    color: '#fff',
    fontWeight: '600'
  }
});
