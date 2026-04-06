import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { auth } from '../../config/firebaseConfig';

const { width } = Dimensions.get('window');

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header Background */}
      <View style={[styles.headerBackground, { height: 160 + insets.top }]} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>JS</Text>
            </View>
          </View>

          <Text style={styles.userName}>João Silva</Text>
          <Text style={styles.userEmail}>joao.silva@email.com</Text>
        </View>

        {/* Minha Conta Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minha Conta</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardItem}
              activeOpacity={0.7}
              onPress={() => router.push('/meus-dados')}
            >
              <Feather name="user" size={20} color="#5B42F3" style={styles.itemIcon} />
              <Text style={styles.itemText}>Meus Dados</Text>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.7} onPress={() => router.push('/alterar-senha')}>
              <Feather name="lock" size={20} color="#5B42F3" style={styles.itemIcon} />
              <Text style={styles.itemText}>Alterar Senha</Text>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.7} onPress={() => router.push('/meus-enderecos')}>
              <Feather name="sliders" size={20} color="#5B42F3" style={styles.itemIcon} />
              <Text style={styles.itemText}>Meus Endereços</Text>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mais Opcoes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mais Opções</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.7} onPress={() => router.push('/suporte')}>
              <Feather name="help-circle" size={20} color="#5B42F3" style={styles.itemIcon} />
              <Text style={styles.itemText}>Ajuda e Suporte</Text>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.7} onPress={() => router.push('/sobre-o-app')}>
              <Feather name="info" size={20} color="#5B42F3" style={styles.itemIcon} />
              <Text style={styles.itemText}>Sobre o Aplicativo</Text>
              <Feather name="chevron-right" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={20} color="#EF4444" style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F5', // Light grey background
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#5B42F3',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 50,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  profileCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    paddingTop: 56,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  avatarContainer: {
    position: 'absolute',
    top: -50,
    alignItems: 'center',
    width: '100%',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0FCE8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#FFF',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10B981',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  itemIcon: {
    marginRight: 16,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 52, // Align with text
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
});
