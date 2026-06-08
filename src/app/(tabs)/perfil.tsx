import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Feather } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { useIsLandscape } from '../../hooks/useIsLandscape';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLandscape } = useIsLandscape();
  const [userData, setUserData] = React.useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchUser() {
        if (auth.currentUser) {
          const docRef = doc(db, 'users', auth.currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        }
      }
      fetchUser();
    }, [])
  );

  async function handleLogout() {
    try {
      await signOut(auth);
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.replace('/');
      }
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header Background */}
      <View style={[styles.headerBackground, { height: isLandscape ? 80 + insets.top : 160 + insets.top }]} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + (isLandscape ? 8 : 20), paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Title */}
        <View style={[styles.headerTop, isLandscape && { marginBottom: 20 }]}>
          <Text style={styles.headerTitle}>Meu Perfil</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {(userData?.avatar || auth.currentUser?.photoURL) ? (
              <Image source={{ uri: userData?.avatar || auth.currentUser?.photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {userData?.name ? userData.name.substring(0, 2).toUpperCase() : 'US'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.userName}>{userData?.name || auth.currentUser?.displayName || 'Usuário'}</Text>
          <Text style={styles.userEmail}>{userData?.email || auth.currentUser?.email || ''}</Text>
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
              <Feather name="user" size={20} color={PRIMARY} style={styles.itemIcon} />
              <Text style={styles.itemText}>Meus Dados</Text>
              <Feather name="chevron-right" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.7} onPress={() => router.push('/alterar-senha')}>
              <Feather name="lock" size={20} color={PRIMARY} style={styles.itemIcon} />
              <Text style={styles.itemText}>Alterar Senha</Text>
              <Feather name="chevron-right" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.7} onPress={() => router.push('/meus-enderecos')}>
              <Feather name="sliders" size={20} color={PRIMARY} style={styles.itemIcon} />
              <Text style={styles.itemText}>Meus Endereços</Text>
              <Feather name="chevron-right" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mais Opcoes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mais Opções</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.7} onPress={() => router.push('/suporte')}>
              <Feather name="help-circle" size={20} color={PRIMARY} style={styles.itemIcon} />
              <Text style={styles.itemText}>Ajuda e Suporte</Text>
              <Feather name="chevron-right" size={20} color={TEXT_MUTED} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.cardItem} activeOpacity={0.7} onPress={() => router.push('/sobre-o-app')}>
              <Feather name="info" size={20} color={PRIMARY} style={styles.itemIcon} />
              <Text style={styles.itemText}>Sobre o Aplicativo</Text>
              <Feather name="chevron-right" size={20} color={TEXT_MUTED} />
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
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 50,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  profileCard: {
    backgroundColor: CARD_BG,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    paddingTop: 56,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: BORDER,
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
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: CARD_BG,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: CARD_BG,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: CARD_BG,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_LIGHT,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 52, // Align with text
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
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
