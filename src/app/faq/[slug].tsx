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

export default function FAQDetailScreen() {
  const { question, answer, icon } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLandscape } = useIsLandscape();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Background (Gradient effect replacement) */}
      <View style={[styles.headerBg, { height: isLandscape ? 80 + insets.top : 200 + insets.top }]} />

      {/* Header Content */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#FFF" />
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
            <Ionicons name={(icon as any) || 'help-circle-outline'} size={40} color="#5245F1" />
          </View>
          <Text style={styles.questionText}>{question}</Text>
        </View>

        {/* Answer Content */}
        <View style={[styles.answerCard, isLandscape && { flex: 0.6, marginTop: 0 }]}>
          <View style={styles.answerHeader}>
            <Feather name="info" size={16} color="#6B7280" />
            <Text style={styles.answerLabel}>RESPOSTA</Text>
          </View>
          <Text style={styles.answerText}>{answer}</Text>
          
          <View style={styles.infoBox}>
            <Feather name="help-circle" size={20} color="#5245F1" />
            <Text style={styles.infoText}>
              Ainda tem dúvidas? Entre em conta conosco através dos canais de atendimento.
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
    backgroundColor: '#F8FAFC',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#5245F1',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    zIndex: 10,
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
    paddingHorizontal: 20,
    zIndex: 20,
  },
  titleCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 28,
  },
  answerCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    color: '#6B7280',
    letterSpacing: 1.2,
  },
  answerText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#5245F1',
    fontWeight: '500',
    lineHeight: 18,
  },
});
