import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';

// --- Data ---

const FAQ_SECTIONS = [
  {
    title: 'Como funciona?',
    items: [
      'O que é o LocaDJe?',
      'Como fazer uma reserva?',
      'Posso cancelar minha reserva?',
    ],
  },
  {
    title: 'Pagamentos',
    items: [
      'Quais formas de pagamento?',
      'Quando sou cobrado?',
      'Como funciona o reembolso?',
    ],
  },
];

// --- Component ---

export default function SuporteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dúvidas de Suporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Sections */}
        <View style={styles.card}>
          {FAQ_SECTIONS.map((section, sectionIndex) => (
            <View key={section.title}>
              {/* Section title */}
              <Text style={styles.sectionTitle}>{section.title}</Text>

              {/* Section items */}
              {section.items.map((item, itemIndex) => (
                <View key={item}>
                  <TouchableOpacity style={styles.faqItem} activeOpacity={0.6}>
                    <Text style={styles.faqItemText}>{item}</Text>
                    <Feather name="chevron-right" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                  {/* Divider between items (not after last item in last section) */}
                  {!(sectionIndex === FAQ_SECTIONS.length - 1 && itemIndex === section.items.length - 1) && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Contact Cards */}
        <Text style={styles.contactTitle}>Entre em contato</Text>
        <View style={styles.contactRow}>
          {/* WhatsApp Card */}
          <TouchableOpacity
            style={[styles.contactCard, styles.contactCardGreen]}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('https://wa.me/5500000000000')}
          >
            <View style={styles.contactIconWrapper}>
              <Ionicons name="chatbubble-ellipses" size={28} color="#16A34A" />
            </View>
            <Text style={styles.contactCardTitle}>WhatsApp</Text>
            <Text style={styles.contactCardSubtitle}>Respostas rápidas</Text>
          </TouchableOpacity>

          {/* Email Card */}
          <TouchableOpacity
            style={[styles.contactCard, styles.contactCardPurple]}
            activeOpacity={0.8}
            onPress={() => Linking.openURL('mailto:suporte@locadje.com')}
          >
            <View style={styles.contactIconWrapperPurple}>
              <Feather name="mail" size={26} color="#5245F1" />
            </View>
            <Text style={styles.contactCardTitle}>E-mail</Text>
            <Text style={styles.contactCardSubtitle}>suporte@locadje.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// --- Styles ---

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
    paddingTop: 24,
    paddingHorizontal: 20,
  },

  // FAQ Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  faqItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },

  // Contact Cards
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  contactCardGreen: {
    backgroundColor: '#DCFCE7',
  },
  contactCardPurple: {
    backgroundColor: '#EDE9FE',
  },
  contactIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactIconWrapperPurple: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  contactCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
