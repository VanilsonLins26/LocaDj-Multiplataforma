import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
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
import { auth } from '../../../config/firebaseConfig';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';
const DANGER = '#EF4444';

export default function AdminProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [initial, setInitial] = useState('A');

  useFocusEffect(
    useCallback(() => {
      const user = auth.currentUser;
      if (user) {
        const name = user.displayName || 'Administrador';
        setDisplayName(name);
        setEmail(user.email || '');
        setEmailVerified(user.emailVerified);
        setInitial((user.displayName || user.email || 'A')[0].toUpperCase());
      }
    }, [])
  );

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
              if (router.canDismiss()) {
                router.dismissAll();
              }
              setTimeout(() => {
                router.replace('/');
              }, 100);
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
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
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
            <View style={[styles.menuIconWrap, { borderColor: PRIMARY }]}>
              <Feather name="user" size={18} color={PRIMARY} />
            </View>
            <Text style={styles.menuItemText}>Meus dados do administrador</Text>
            <Feather name="chevron-right" size={18} color={TEXT_MUTED} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/alterar-senha' as never)}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconWrap, { borderColor: '#3B82F6' }]}>
              <Feather name="lock" size={18} color="#3B82F6" />
            </View>
            <Text style={styles.menuItemText}>Alterar senha</Text>
            <Feather name="chevron-right" size={18} color={TEXT_MUTED} />
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
          <View style={[styles.menuIconWrap, { borderColor: DANGER }]}>
            <Feather name="log-out" size={18} color={DANGER} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: TEXT_LIGHT,
    fontSize: 20,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Profile Card
  profileCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#18181B',
    borderWidth: 2,
    borderColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: PRIMARY,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 12,
  },
  unverifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: DANGER,
  },
  unverifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: DANGER,
  },

  // Section Label
  sectionLabel: {
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Menu Card
  menuCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_LIGHT,
  },
  menuDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },

  // Logout
  logoutCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: DANGER,
  },
});
