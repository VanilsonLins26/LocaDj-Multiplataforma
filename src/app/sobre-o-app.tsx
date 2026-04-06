import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const APP_VERSION = '1.0.0';
const BUILD_NUMBER = '2025.1';

interface LinkRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  showDivider?: boolean;
}

function LinkRow({ icon, label, onPress, showDivider = true }: LinkRowProps) {
  return (
    <>
      <TouchableOpacity style={styles.linkRow} onPress={onPress} activeOpacity={0.7}>
        <Feather name={icon} size={20} color="#5245F1" style={styles.linkIcon} />
        <Text style={styles.linkLabel}>{label}</Text>
        <Feather name="chevron-right" size={20} color="#9CA3AF" />
      </TouchableOpacity>
      {showDivider && <View style={styles.divider} />}
    </>
  );
}

export default function SobreOAppScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sobre o App</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + App Name */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>DJ</Text>
          </View>
          <Text style={styles.appName}>LocaDJ</Text>
          <Text style={styles.appTagline}>Conectando artistas e clientes</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Versão {APP_VERSION} · Build {BUILD_NUMBER}</Text>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o LocaDJ</Text>
          <View style={styles.card}>
            <Text style={styles.descriptionText}>
              O <Text style={styles.bold}>LocaDJ</Text> é uma plataforma que conecta DJs profissionais
              a clientes em busca do artista perfeito para o seu evento. De festas íntimas a grandes
              produções, estamos aqui para tornar sua experiência musical inesquecível.
            </Text>
            <Text style={[styles.descriptionText, { marginTop: 12 }]}>
              Encontre, compare e contrate DJs com facilidade, segurança e transparência.
            </Text>
          </View>
        </View>

        {/* Links Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.card}>
            <LinkRow
              icon="shield"
              label="Política de Privacidade"
              onPress={() => openUrl('https://locadj.com.br/privacidade')}
            />
            <LinkRow
              icon="file-text"
              label="Termos de Uso"
              onPress={() => openUrl('https://locadj.com.br/termos')}
            />
            <LinkRow
              icon="package"
              label="Licenças de Código Aberto"
              onPress={() => openUrl('https://locadj.com.br/licencas')}
              showDivider={false}
            />
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <View style={styles.card}>
            <LinkRow
              icon="mail"
              label="Fale Conosco"
              onPress={() => openUrl('mailto:contato@locadj.com.br')}
            />
            <LinkRow
              icon="globe"
              label="Visite nosso site"
              onPress={() => openUrl('https://locadj.com.br')}
              showDivider={false}
            />
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} LocaDJ · Todos os direitos reservados
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F9',
  },
  header: {
    backgroundColor: '#5245F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },

  scrollContent: {
    paddingTop: 28,
    paddingHorizontal: 20,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#5245F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#5245F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#040417',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 10,
  },
  versionBadge: {
    backgroundColor: '#EEF0FF',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  versionText: {
    fontSize: 12,
    color: '#5245F1',
    fontWeight: '600',
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Description
  descriptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  bold: {
    fontWeight: '700',
    color: '#040417',
  },

  // Link rows
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  linkIcon: {
    marginRight: 12,
  },
  linkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },

  // Footer
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#C4C9D4',
    marginTop: 8,
  },
});
