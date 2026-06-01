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
import { useIsLandscape } from '../hooks/useIsLandscape';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

// --- Data ---

const FAQ_SECTIONS = [
  {
    title: 'Como funciona?',
    items: [
      {
        slug: 'o-que-e-o-locadje',
        question: 'O que é o LocaDJe?',
        answer: 'O LocaDJe é a plataforma definitiva para aluguel de kits de som e iluminação. Facilitamos o acesso a equipamentos profissionais para DJs e eventos, garantindo qualidade, segurança e entrega pontual para que sua festa seja inesquecível.',
        icon: 'cube-outline'
      },
      {
        slug: 'como-fazer-reserva',
        question: 'Como fazer uma reserva?',
        answer: 'É simples: explore nosso catálogo, escolha o kit ideal, selecione as datas desejadas, informe o endereço de entrega e finalize o pagamento via Mercado Pago. Nós cuidamos do resto!',
        icon: 'calendar-outline'
      },
      {
        slug: 'posso-cancelar',
        question: 'Posso cancelar minha reserva?',
        answer: 'Sim! Cancelamentos feitos com até 24 horas de antecedência do início da reserva são totalmente reembolsáveis. Após esse prazo, consulte nossa central de atendimento para verificar possíveis taxas.',
        icon: 'close-circle-outline'
      },
    ],
  },
  {
    title: 'Pagamentos',
    items: [
      {
        slug: 'formas-pagamento',
        question: 'Quais formas de pagamento?',
        answer: 'Trabalhamos com toda a conveniência do Mercado Pago. Você pode pagar via Cartão de Crédito (com parcelamento), Cartão de Débito, Pix (aprovação imediata) ou Boleto Bancário.',
        icon: 'card-outline'
      },
      {
        slug: 'quando-sou-cobrado',
        question: 'Quando sou cobrado?',
        answer: 'A cobrança é realizada no momento em que você confirma a transação no checkout. Isso garante que o equipamento fique reservado exclusivamente para você no período selecionado.',
        icon: 'time-outline'
      },
      {
        slug: 'como-reembolso',
        question: 'Como funciona o reembolso?',
        answer: 'O reembolso é processado através do Mercado Pago. Caso você cancele dentro do prazo, o valor estornado aparecerá na sua fatura do cartão ou retornará para sua conta bancária conforme o método original.',
        icon: 'refresh-outline'
      },
    ],
  },
];

// --- Component ---

export default function SuporteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLandscape } = useIsLandscape();

  const handleFAQPress = (item: any) => {
    router.push({
      pathname: `/faq/${item.slug}`,
      params: { 
        question: item.question,
        answer: item.answer,
        icon: item.icon
      }
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { 
          paddingTop: isLandscape ? Math.max(insets.top, 10) + 4 : Math.max(insets.top, 20) + 12,
          paddingBottom: isLandscape ? 12 : 20 
      }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color={TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isLandscape && { fontSize: 18 }]}>Dúvidas de Suporte</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { 
            paddingBottom: Math.max(insets.bottom, 24),
            paddingTop: isLandscape ? 12 : 24
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Sections */}
        <View style={[styles.card, isLandscape && { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 10 }]}>
          {FAQ_SECTIONS.map((section, sectionIndex) => (
            <View key={section.title} style={isLandscape ? { width: '50%' } : null}>
              {/* Section title */}
              <Text style={styles.sectionTitle}>{section.title}</Text>

              {/* Section items */}
              {section.items.map((item, itemIndex) => (
                <View key={item.slug}>
                  <TouchableOpacity 
                    style={styles.faqItem} 
                    activeOpacity={0.6}
                    onPress={() => handleFAQPress(item)}
                  >
                    <Text style={styles.faqItemText}>{item.question}</Text>
                    <Feather name="chevron-right" size={18} color={TEXT_MUTED} />
                  </TouchableOpacity>
                  {/* Divider between items (not after last item in section unless portrait) */}
                  {(!isLandscape || itemIndex < section.items.length - 1) && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Contact Cards */}
        <Text style={styles.contactTitle}>Entre em contato</Text>
        <View style={[styles.contactRow, isLandscape && { marginBottom: 20 }]}>
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
              <Feather name="mail" size={26} color={PRIMARY} />
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
    backgroundColor: BG,
  },
  header: {
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },

  // FAQ Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
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
    color: TEXT_LIGHT,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginHorizontal: 20,
  },

  // Contact Cards
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT_MUTED,
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
    borderWidth: 1,
  },
  contactCardGreen: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  contactCardPurple: {
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  contactIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactIconWrapperPurple: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  contactCardSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
});
