import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
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
  createdAt: any;
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

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name ? item.name.charAt(0).toUpperCase() : '?'}
            </Text>
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
    marginBottom: 12,
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
