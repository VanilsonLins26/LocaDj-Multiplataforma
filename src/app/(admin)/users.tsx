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
import { db, auth } from '../../config/firebaseConfig';
import { useRouter } from 'expo-router';

const PRIMARY = '#5B4EE4';
const GRAY_100 = '#F3F4F6';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_900 = '#111827';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
  createdAt: any;
  ratings?: Record<string, { score: number; feedback: string }>;
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
            'Authorization': `Bearer ${idToken}`
          };

          const BASE_URL = 'https://locadj.onrender.com/api/reservations';
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

      // Adicionar usuário fixo de exemplo
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
        rentalCount: 4, // Exemplo com 4 locações, mas apenas 3 avaliadas
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
        <View style={[styles.ratingContainer, ratingCount === 0 && styles.ratingContainerEmpty]}>
          <Ionicons name="star" size={16} color={ratingCount > 0 ? "#F59E0B" : "#9CA3AF"} />
          <Text style={[styles.ratingText, ratingCount === 0 && styles.ratingTextEmpty]}>
            Média: {ratingCount > 0 ? (Number.isInteger(avgScore) ? avgScore : avgScore.toFixed(1)) : '-'}
            <Text style={[styles.ratingCount, ratingCount === 0 && styles.ratingCountEmpty]}>
              {ratingCount > 0 ? `/10 (${ratingCount} ${ratingCount === 1 ? 'avaliação' : 'avaliações'})` : ' (sem avaliações)'}
            </Text>
          </Text>
        </View>

        {item.rentalCount !== undefined && (
          <View style={[styles.rentalContainer, item.rentalCount === 0 && styles.rentalContainerEmpty]}>
            <Ionicons name="calendar" size={16} color={item.rentalCount > 0 ? "#059669" : "#9CA3AF"} />
            <Text style={[styles.rentalText, item.rentalCount === 0 && styles.rentalTextEmpty]}>
              {item.rentalCount > 0 ? `Já alugou ${item.rentalCount} ${item.rentalCount === 1 ? 'vez' : 'vezes'}` : 'Nunca fez um aluguel'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.detailsButton} 
          onPress={() => router.push({
            pathname: '/(admin)/user/[id]',
            params: { id: item.id }
          })}
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
          <Ionicons name="arrow-back" size={24} color={GRAY_900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuários</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={GRAY_500} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou e-mail"
          placeholderTextColor={GRAY_300}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={GRAY_300} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={60} color={GRAY_300} />
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GRAY_900,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GRAY_100,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: GRAY_900,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: GRAY_100,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingContainerEmpty: {
    backgroundColor: '#F3F4F6',
  },
  ratingText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  ratingTextEmpty: {
    color: '#6B7280',
  },
  ratingCount: {
    fontSize: 11,
    fontWeight: '400',
    color: '#92400E',
  },
  ratingCountEmpty: {
    color: '#9CA3AF',
  },
  rentalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rentalContainerEmpty: {
    backgroundColor: '#F3F4F6',
  },
  rentalText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  rentalTextEmpty: {
    color: '#6B7280',
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: GRAY_100,
    paddingTop: 12,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  detailsButtonText: {
    color: PRIMARY,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GRAY_900,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: GRAY_500,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: GRAY_500,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleUser: {
    backgroundColor: '#E0F2FE',
  },
  roleAdmin: {
    backgroundColor: '#FEF3C7',
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  roleTextUser: {
    color: '#0284C7',
  },
  roleTextAdmin: {
    color: '#D97706',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: GRAY_500,
  },
});
