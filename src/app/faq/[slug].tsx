import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useIsLandscape } from '../../hooks/useIsLandscape';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

export default function FAQDetailScreen() {
  const { question, answer, icon } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLandscape } = useIsLandscape();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Content */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color={TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Central de Ajuda</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingBottom: Math.max(insets.bottom, 24),
            paddingTop: isLandscape ? 10 : 20 
          },
          isLandscape && { flexDirection: 'row', alignItems: 'flex-start', gap: 24 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon & Title Card */}
        <View style={[styles.titleCard, isLandscape && { flex: 0.4, marginBottom: 0 }]}>
          <View style={styles.iconCircle}>
            <Ionicons name={(icon as any) || 'help-circle-outline'} size={40} color={PRIMARY} />
          </View>
          <Text style={styles.questionText}>{question}</Text>
        </View>

        {/* Answer Content */}
        <View style={[styles.answerCard, isLandscape && { flex: 0.6, marginTop: 0 }]}>
          <View style={styles.answerHeader}>
            <Feather name="info" size={16} color={TEXT_MUTED} />
            <Text style={styles.answerLabel}>RESPOSTA</Text>
          </View>
          <Text style={styles.answerText}>{answer}</Text>
          
          <View style={styles.infoBox}>
            <Feather name="help-circle" size={20} color={PRIMARY} />
            <Text style={styles.infoText}>
              Ainda tem dúvidas? Entre em contato conosco através dos canais de atendimento.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: CARD_BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    zIndex: 10,
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
    zIndex: 20,
  },
  titleCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_LIGHT,
    textAlign: 'center',
    lineHeight: 28,
  },
  answerCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: BORDER,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 1.2,
  },
  answerText: {
    fontSize: 16,
    color: TEXT_LIGHT,
    lineHeight: 26,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(139, 92, 246, 0.05)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: PRIMARY,
    fontWeight: '500',
    lineHeight: 18,
  },
});
