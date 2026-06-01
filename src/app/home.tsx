import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { auth } from '../config/firebaseConfig';

const PRIMARY = '#8b5cf6'; // vibrant purple matching the image
const DARK_BG = '#04040a'; // very dark background
const GRAY_400 = '#9ca3af';

const AnimatedLight = ({ color, size, top, left, right, bottom, delay = 0, moveX = 100, moveY = 100, duration = 8000 }: any) => {
  const opacity = useSharedValue(0.6);
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const gradId = `grad-${color.replace('#', '')}-${size}`; // Unique-ish ID based on props

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.5, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      translateX.value = withRepeat(
        withTiming(moveX, { duration: duration, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      translateY.value = withRepeat(
        withTiming(moveY, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [delay, moveX, moveY, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          top,
          left,
          right,
          bottom,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Svg height={size} width={size}>
        <Defs>
          <RadialGradient id={gradId} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <Stop offset="40%" stopColor={color} stopOpacity="0.2" />
            <Stop offset="70%" stopColor={color} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={size} height={size} fill={`url(#${gradId})`} />
      </Svg>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(!!auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return unsubscribe;
  }, []);

  async function handleAuthAction() {
    if (isLoggedIn) {
      try {
        await signOut(auth);
        router.replace('/');
      } catch (error) {
        console.error('Erro ao sair da conta:', error);
      }
    } else {
      router.push('/login');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={StyleSheet.absoluteFillObject}>
        <AnimatedLight color="#8b5cf6" size={300} top={-50} left={-50} delay={0} moveX={150} moveY={100} duration={8000} />
        <AnimatedLight color="#c026d3" size={400} top={200} right={-100} delay={500} moveX={-200} moveY={150} duration={10000} />
        <AnimatedLight color="#3b82f6" size={350} bottom={100} left={-50} delay={1000} moveX={180} moveY={-120} duration={9000} />
        <AnimatedLight color="#8b5cf6" size={250} bottom={-50} right={100} delay={1500} moveX={-150} moveY={-150} duration={7000} />
        
        {/* Mais luzes adicionadas para um fundo mais rico */}
        <AnimatedLight color="#ec4899" size={350} top={350} left={100} delay={800} moveX={200} moveY={-150} duration={11000} />
        <AnimatedLight color="#06b6d4" size={450} top={500} right={50} delay={1200} moveX={-150} moveY={200} duration={12000} />
        <AnimatedLight color="#6366f1" size={400} bottom={300} left={200} delay={2000} moveX={250} moveY={150} duration={13000} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>LocaDJ</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={handleAuthAction}>
            <Text style={styles.loginBtnText}>{isLoggedIn ? 'Sair' : 'Login'}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrapper}>
            <Image source={require('../../assets/images/Logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.heroTitle}>
            Alugue equipamentos{'\n'}para o seu set
          </Text>
          <Text style={styles.heroSubtitle}>
            Tudo o que você precisa para o próximo evento, na palma da mão.
          </Text>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Começar agora</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={GRAY_400} style={{ marginRight: 10 }} />
            <TextInput
              style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
              placeholder="Ver equipamentos"
              placeholderTextColor={GRAY_400}
            />
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>+500</Text>
            <Text style={styles.statLabel}>Equipamentos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>+1k</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.9</Text>
            <Text style={styles.statLabel}>Avaliação</Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Por que escolher o LocaDJ?</Text>
          <View style={styles.featuresRow}>
            <View style={styles.featureItem}>
              <Ionicons name="musical-notes-outline" size={32} color={PRIMARY} style={styles.featureIcon} />
              <Text style={styles.featureTitle}>EquipaDJ</Text>
              <Text style={styles.featureText}>Alugue equipamentos de alta qualidade para suas festas e eventos.</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar-outline" size={32} color={PRIMARY} style={styles.featureIcon} />
              <Text style={styles.featureTitle}>Agende Online</Text>
              <Text style={styles.featureText}>Reserve com facilidade pelo app, sem burocracia.</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="star-outline" size={32} color={PRIMARY} style={styles.featureIcon} />
              <Text style={styles.featureTitle}>Avaliações</Text>
              <Text style={styles.featureText}>Confira reviews de outros usuários e escolha com confiança.</Text>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Ionicons name="rocket-outline" size={32} color={PRIMARY} style={styles.ctaIcon} />
          <Text style={styles.ctaTitle}>Pronto para começar?</Text>
          <Text style={styles.ctaSubtitle}>Crie sua conta grátis e acesse todos os equipamentos.</Text>

          <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Criar conta gratuita</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8} onPress={() => router.push('/login')}>
            <Text style={styles.secondaryBtnText}>Já tenho conta <Ionicons name="arrow-forward" size={14} color={PRIMARY} /> Entrar</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 LocaDJ - Todos os direitos reservados</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DARK_BG },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  logoText: {
    color: PRIMARY,
    fontSize: 20,
    fontWeight: 'bold',
  },
  loginBtn: {
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  heroIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 40,
    height: 40,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: GRAY_400,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 500,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 32,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    width: '100%',
    maxWidth: 600,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: GRAY_400,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 10,
  },
  featuresSection: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 250,
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: GRAY_400,
    textAlign: 'center',
    lineHeight: 22,
  },
  ctaSection: {
    marginTop: 40,
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 60,
  },
  ctaIcon: {
    marginBottom: 16,
  },
  ctaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 16,
    color: GRAY_400,
    textAlign: 'center',
    marginBottom: 32,
  },
  secondaryBtn: {
    marginTop: 8,
    padding: 10,
  },
  secondaryBtnText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 60,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 24,
  },
  footerText: {
    color: GRAY_400,
    fontSize: 12,
  },
});