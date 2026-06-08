import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../../config/firebaseConfig';
import { useRouter } from 'expo-router';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const BORDER_LIGHT = '#3F3F46';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  cpf?: string;
  createdAt: any;
  ratings?: Record<string, { score: number; feedback: string; createdAt?: string }>;
  rentalCount?: number;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedUsers: User[] = [];
      querySnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as User);
      });
      
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          const headers: Record<string, string> = { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          };

          const BASE_URL = 'https://locadj.onrender.com/api/reservations/all';
          const listResp = await fetch(BASE_URL, { headers });
          let allData: any[] = [];
          
          if (listResp.ok) {
            const json = await listResp.json();
            allData = Array.isArray(json) ? json : (json.value ?? []);
            
            const emailCounts: Record<string, number> = {};
            allData.forEach(item => {
              if (item && item.user && item.user.email) {
                const email = item.user.email.toLowerCase();
                emailCounts[email] = (emailCounts[email] || 0) + 1;
              }
            });
            
            fetchedUsers.forEach(user => {
               if (user.email) {
                 user.rentalCount = emailCounts[user.email.toLowerCase()] || 0;
               }
            });
          } else {
             fetchedUsers.forEach(user => { user.rentalCount = 0; });
          }
        } else {
           fetchedUsers.forEach(user => { user.rentalCount = 0; });
        }
      } catch (apiError) {
        console.error('Erro na API de reservas:', apiError);
        fetchedUsers.forEach(user => { user.rentalCount = 0; });
      }

      const mockUser: User = {
        id: 'mock-user-123',
        name: 'Usuário Exemplo',
        email: 'exemplo@locadj.com',
        phone: '(11) 98765-4321',
        role: 'user',
        avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4',
        createdAt: new Date().toISOString(),
        ratings: {
          'loc1': { score: 10, feedback: 'Excelente!' },
          'loc2': { score: 8, feedback: 'Entregou um pouco atrasado.' },
          'loc3': { score: 9, feedback: 'Ótimo estado.' }
        },
        rentalCount: 4,
      };
      fetchedUsers.unshift(mockUser);

      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const filteredUsers = users.filter(user => 
    (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: User }) => {
    let avgScore = 0;
    let ratingCount = 0;
    if (item.ratings) {
      const scores = Object.values(item.ratings).map(r => r.score);
      if (scores.length > 0) {
        ratingCount = scores.length;
        avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
    }

    return (
    <View style={styles.userCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
              </Text>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userPhone}>{item.phone || 'Sem telefone'}</Text>
          </View>
        </View>
        <View style={[styles.roleBadge, item.role === 'admin' ? styles.roleAdmin : styles.roleUser]}>
          <Text style={[styles.roleText, item.role === 'admin' ? styles.roleTextAdmin : styles.roleTextUser]}>
            {item.role === 'admin' ? 'Admin' : 'Usuário'}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBox, ratingCount > 0 ? styles.ratingBoxActive : styles.statBoxEmpty]}>
          <Ionicons name="star" size={14} color={ratingCount > 0 ? "#EAB308" : TEXT_MUTED} />
          <Text style={[styles.statText, ratingCount > 0 ? styles.ratingTextActive : styles.statTextEmpty]}>
            Média: {ratingCount > 0 ? (Number.isInteger(avgScore) ? avgScore : avgScore.toFixed(1)) : '-'}
            <Text style={[styles.statCount, ratingCount > 0 ? styles.ratingCountActive : styles.statCountEmpty]}>
              {ratingCount > 0 ? `/10 (${ratingCount} ${ratingCount === 1 ? 'avaliação' : 'avaliações'})` : ' (sem avaliações)'}
            </Text>
          </Text>
        </View>

        {item.rentalCount !== undefined && (
          <View style={[styles.statBox, item.rentalCount > 0 ? styles.rentalBoxActive : styles.statBoxEmpty]}>
            <Ionicons name="calendar-outline" size={14} color={item.rentalCount > 0 ? "#10B981" : TEXT_MUTED} />
            <Text style={[styles.statText, item.rentalCount > 0 ? styles.rentalTextActive : styles.statTextEmpty]}>
              {item.rentalCount > 0 ? `Já alugou ${item.rentalCount} ${item.rentalCount === 1 ? 'vez' : 'vezes'}` : 'Nunca fez um aluguel'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.detailsButton} 
          onPress={() => router.push(`/(admin)/user/${item.id}` as any)}
        >
          <Text style={styles.detailsButtonText}>Ver Detalhes da Conta</Text>
          <Ionicons name="chevron-forward" size={16} color={PRIMARY} />
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuários</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={TEXT_MUTED} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou e-mail"
          placeholderTextColor={TEXT_MUTED}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} colors={[PRIMARY]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={BORDER} />
              <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: TEXT_LIGHT,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  userCard: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#18181B',
    borderWidth: 1.5,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  roleUser: {
    backgroundColor: '#2E1065', // Dark purple
  },
  roleAdmin: {
    backgroundColor: '#78350F', // Dark amber/orange
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  roleTextUser: {
    color: '#C084FC', // Light purple
  },
  roleTextAdmin: {
    color: '#FBBF24', // Light amber
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    paddingLeft: 68, // Align with text instead of avatar
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statBoxEmpty: {
    backgroundColor: 'transparent',
    borderColor: BORDER_LIGHT,
  },
  ratingBoxActive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    paddingHorizontal: 0, // No background or border for active rating
  },
  rentalBoxActive: {
    backgroundColor: 'transparent', // Or very dark green if preferred
    borderColor: '#059669', // Green border
  },
  statText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  statTextEmpty: {
    color: TEXT_MUTED,
  },
  ratingTextActive: {
    color: '#EAB308',
  },
  rentalTextActive: {
    color: '#10B981',
  },
  statCount: {
    fontSize: 11,
    fontWeight: '400',
  },
  statCountEmpty: {
    color: TEXT_MUTED,
  },
  ratingCountActive: {
    color: TEXT_MUTED,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: '#18181B',
    paddingTop: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  detailsButtonText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: TEXT_MUTED,
  },
});
