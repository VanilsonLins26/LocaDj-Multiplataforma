import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';

const PRIMARY = '#5B42F3';
const BG = '#F4F4F5';

export default function ReservationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReservations() {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, 'reservations'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const data: any[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });
        
        // Se caso a query vier vazia, vamos colocar alguns mockados para o usuário ver a UI
        if (data.length === 0) {
          data.push({
            id: 'mock1',
            kitName: 'Kit Avançado DJ',
            status: 'Confirmada',
            startDate: '10/04/2026 03:06',
            endDate: '12/04/2026 03:06'
          });
          data.push({
            id: 'mock2',
            kitName: 'Kit Iluminação',
            status: 'Confirmada',
            startDate: '29/11/2025 20:28',
            endDate: '10/12/2025 20:28'
          });
          data.push({
            id: 'mock3',
            kitName: 'Kit Acessórios',
            status: 'Pendente',
            startDate: '01/12/2025 00:08',
            endDate: '03/12/2025 00:08'
          });
          data.push({
            id: 'mock4',
            kitName: 'Kit Avançado DJ',
            status: 'Confirmada',
            startDate: '01/12/2025 21:15',
            endDate: '02/12/2025 21:15'
          });
        }

        setReservations(data);
      } catch (error) {
        console.error("Erro ao carregar reservas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, []);

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

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardHeader}>
            <Text style={styles.kitName}>{item.kitName || 'Kit sem nome'}</Text>
            {renderBadge(item.status || 'Pendente')}
          </View>
          
          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>INÍCIO</Text>
              <Text style={styles.dateValue}>{item.startDate}</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>FIM</Text>
              <Text style={styles.dateValue}>{item.endDate}</Text>
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
