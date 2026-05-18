import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';

const PRIMARY = '#5245F1';
const BG = '#F4F4F9';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#040417';
const TEXT_LIGHT = '#6B7280';
const BORDER = '#E5E7EB';

export default function AdminProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [initial, setInitial] = useState('A');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const name = user.displayName || 'Administrador';
      setDisplayName(name);
      setEmail(user.email || '');
      setEmailVerified(user.emailVerified);
      setInitial((user.displayName || user.email || 'A')[0].toUpperCase());
    }
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await auth.signOut();
              router.replace('/login');
            } catch {
              Alert.alert('Erro', 'Não foi possível sair no momento.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>

          {/* Email verification badge */}
          {!emailVerified && (
            <View style={styles.unverifiedBadge}>
              <Feather name="alert-circle" size={13} color="#EF4444" />
              <Text style={styles.unverifiedText}>E-mail não verificado</Text>
            </View>
          )}
        </View>

        {/* Menu Options */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Conta</Text>
        </View>

        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(admin)/admin-profile-data' as never)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#EDEDFF' }]}>
              <Feather name="user" size={18} color={PRIMARY} />
            </View>
            <Text style={styles.menuItemText}>Meus dados do administrador</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/alterar-senha' as never)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Feather name="lock" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.menuItemText}>Alterar senha</Text>
            <Feather name="chevron-right" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={styles.sectionLabel}>
          <Text style={styles.sectionLabelText}>Sessão</Text>
        </View>

        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Feather name="log-out" size={18} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: WHITE,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Profile Card
  profileCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EDEDFF',
    borderWidth: 4,
    borderColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: PRIMARY,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: TEXT_LIGHT,
    marginBottom: 12,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  unverifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Section Label
  sectionLabel: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Menu Card
  menuCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_DARK,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },

  // Logout
  logoutCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
});
