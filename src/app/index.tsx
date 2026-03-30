import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../config/firebaseConfig';

const PRIMARY = '#5245F1';
const DARK_BG = '#040417';
const WHITE = '#FFFFFF';
const GRAY_500 = '#6B7280';
const GRAY_100 = '#F3F4F6';
const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const router = useRouter();

  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const role = userDoc.exists() ? userDoc.data()?.role : 'user';

          if (role === 'admin') {
            router.replace('/dashboard');
          } else {
            router.replace('/(tabs)/kits_list');
          }
        } catch (error) {
          router.replace('/(tabs)/kits_list');
        }
      } else {

        setIsChecking(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isChecking) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }
  const features = [
    { icon: 'musical-notes-outline' as const, title: 'EquipaDJ', desc: 'Alugue equipamentos de alta qualidade para suas festas e eventos.' },
    { icon: 'calendar-outline' as const, title: 'Agende Online', desc: 'Reserve com facilidade pelo app, sem burocracia.' },
    { icon: 'star-outline' as const, title: 'Avaliações', desc: 'Confira reviews de outros usuários e escolha com confiança.' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BG} />

      {/* ─── NAVBAR ─── */}
      <View style={styles.navbar}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>LocaDJ</Text>
          </View>
        </View>

        {/* Botão Login */}
        <TouchableOpacity
          style={styles.navLoginBtn}
          onPress={() => router.push('/login')}
          activeOpacity={0.85}
        >
          <Text style={styles.navLoginText}>Login</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ─── HERO ─── */}
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="flash" size={13} color={PRIMARY} />
            <Text style={styles.heroBadgeText}>O app de aluguel para DJs</Text>
          </View>

          <Text style={styles.heroTitle}>
            Alugue equipamentos{'\n'}
            <Text style={styles.heroTitleAccent}>para o seu set</Text>
          </Text>

          <Text style={styles.heroSub}>
            Tudo que você precisa para o próximo evento, na palma da mão. Equipamentos de qualidade, entrega rápida.
          </Text>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroBtnPrimary}
              onPress={() => router.push('/register')}
              activeOpacity={0.85}
            >
              <Text style={styles.heroBtnPrimaryText}>Começar agora</Text>
              <Ionicons name="arrow-forward" size={18} color={WHITE} style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroBtnSecondary}
              activeOpacity={0.8}
            >
              <Ionicons name="search-outline" size={16} color={DARK_BG} style={{ marginRight: 6 }} />
              <Text style={styles.heroBtnSecondaryText}>Ver equipamentos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── STATS ─── */}
        <View style={styles.statsRow}>
          {[
            { value: '+500', label: 'Equipamentos' },
            { value: '+1k', label: 'Clientes' },
            { value: '4.9', label: 'Avaliação' },
          ].map((s, i) => (
            <View key={i} style={[styles.statItem, i < 2 && styles.statBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ─── FEATURES ─── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Por que escolher o LocaD?</Text>
          <View style={styles.featuresList}>
            {features.map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={f.icon} size={22} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── CTA FINAL ─── */}
        <View style={styles.ctaCard}>
          <Ionicons name="rocket-outline" size={28} color={PRIMARY} style={{ marginBottom: 12 }} />
          <Text style={styles.ctaTitle}>Pronto para começar?</Text>
          <Text style={styles.ctaSub}>Crie sua conta grátis e acesse todos os equipamentos</Text>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push('/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Criar conta gratuita</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/login')} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.ctaLoginLink}>Já tenho conta → Entrar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} LocaDJ · Todos os direitos reservados</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK_BG },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  /* Navbar */
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12, backgroundColor: PRIMARY,
  },
  logoWrap: { flexDirection: 'row', alignItems: 'center' },
  logoBadge: { paddingHorizontal: 10, paddingVertical: 5 },
  logoBadgeText: { color: WHITE, fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  navLoginBtn: {
    backgroundColor: WHITE, borderRadius: 8,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  navLoginText: { color: PRIMARY, fontSize: 14, fontWeight: '700' },

  /* Hero */
  hero: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(82,69,241,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 20,
  },
  heroBadgeText: { fontSize: 12, color: '#A5B4FC', fontWeight: '600' },

  heroTitle: { fontSize: 32, fontWeight: '800', color: WHITE, lineHeight: 40, marginBottom: 16 },
  heroTitleAccent: { color: '#A5B4FC' },

  heroSub: { fontSize: 15, color: '#9CA3AF', lineHeight: 23, marginBottom: 32 },

  heroActions: { gap: 12 },
  heroBtnPrimary: {
    backgroundColor: PRIMARY, borderRadius: 16, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: PRIMARY, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  heroBtnPrimaryText: { color: WHITE, fontSize: 16, fontWeight: '700' },
  heroBtnSecondary: {
    backgroundColor: WHITE, borderRadius: 16, height: 54,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  heroBtnSecondaryText: { color: DARK_BG, fontSize: 16, fontWeight: '600' },

  /* Stats */
  statsRow: {
    flexDirection: 'row', marginHorizontal: 24, marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' },
  statValue: { fontSize: 22, fontWeight: '800', color: WHITE },
  statLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

  /* Features */
  section: { paddingHorizontal: 24, marginBottom: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: WHITE, marginBottom: 16 },
  featuresList: { gap: 12 },
  featureCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16,
  },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(82,69,241,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: WHITE, marginBottom: 3 },
  featureDesc: { fontSize: 13, color: '#9CA3AF', lineHeight: 18 },

  /* CTA */
  ctaCard: {
    marginHorizontal: 24, backgroundColor: WHITE, borderRadius: 20,
    padding: 28, alignItems: 'center', marginBottom: 24,
  },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: DARK_BG, marginBottom: 8 },
  ctaSub: { fontSize: 14, color: GRAY_500, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  ctaBtn: {
    backgroundColor: PRIMARY, borderRadius: 14, height: 50, width: '100%',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  ctaBtnText: { color: WHITE, fontSize: 15, fontWeight: '700' },
  ctaLoginLink: { fontSize: 14, color: PRIMARY, fontWeight: '600' },

  footer: { fontSize: 12, color: '#4B5563', textAlign: 'center', paddingHorizontal: 24 },
});