import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseConfig';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';
const SUCCESS = '#10B981';
const ERROR = '#EF4444';

type Phase = 'email' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleBack() {
    setError('');
    if (phase === 'email') {
      router.back();
    } else {
      router.replace('/');
    }
  }

  async function handleSendEmail() {
    if (!email.trim() || !email.includes('@')) { 
      setError('Digite um e-mail válido.'); 
      return; 
    }
    
    setError(''); 
    setLoading(true);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setPhase('done');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('Não há conta cadastrada com este e-mail.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O formato do e-mail é inválido.');
      } else {
        setError('Erro ao enviar. Verifique sua conexão e tente novamente.');
      }
    } finally { 
      setLoading(false); 
    }
  }

  const config = {
    email: { icon: 'mail-outline' as const,             iconBg: 'rgba(139, 92, 246, 0.15)', iconColor: PRIMARY,  title: 'Recuperar senha',  sub: 'Informe seu e-mail cadastrado para receber o link de recuperação' },
    done:  { icon: 'checkmark-circle-outline' as const, iconBg: 'rgba(16, 185, 129, 0.15)', iconColor: SUCCESS, title: 'E-mail enviado!', sub: `Enviamos as instruções de recuperação para o e-mail:\n${email}` },
  };
  const cfg = config[phase];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Ícone */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
              <Ionicons name={cfg.icon} size={36} color={cfg.iconColor} />
            </View>
          </View>

          <Text style={styles.title}>{cfg.title}</Text>
          <Text style={styles.subtitle}>{cfg.sub}</Text>

          {/* ─── FASE 1: PEDIR E-MAIL ─── */}
          {phase === 'email' && (
            <>
              <Text style={styles.label}>E-MAIL CADASTRADO</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={TEXT_MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#52525B"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  autoFocus
                />
              </View>

              {error ? <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color={ERROR} /><Text style={styles.errorText}>{error}</Text></View> : null}

              <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleSendEmail} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Enviar link de recuperação</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backLinkWrap} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8 }}>
                <Ionicons name="arrow-back" size={14} color={PRIMARY} style={{ marginRight: 4 }} />
                <Text style={styles.backLink}>Voltar ao login</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─── FASE 2: SUCESSO ─── */}
          {phase === 'done' && (
            <>
              <View style={styles.successCard}>
                <Ionicons name="mail-open-outline" size={28} color={SUCCESS} style={{ marginBottom: 8 }} />
                <Text style={styles.successText}>Abra o seu e-mail, clique no link e crie sua nova senha.</Text>
              </View>

              <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/login')} activeOpacity={0.85}>
                <Text style={styles.btnText}>Voltar para o Login</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },

  scroll: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 16, paddingBottom: 40 },

  iconContainer: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 24, fontWeight: '700', color: TEXT_LIGHT, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', marginBottom: 32, lineHeight: 21, paddingHorizontal: 8 },

  label: { fontSize: 11, fontWeight: '700', color: TEXT_LIGHT, letterSpacing: 1, marginBottom: 12, marginTop: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 12, marginBottom: 24 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: TEXT_LIGHT, paddingVertical: 0 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -12, marginBottom: 16 },
  errorText: { fontSize: 13, color: ERROR },

  btnPrimary: { backgroundColor: PRIMARY, borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  backLinkWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  backLink: { fontSize: 14, color: PRIMARY, fontWeight: '600' },

  successCard: { backgroundColor: 'rgba(16, 185, 129, 0.05)', borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 28 },
  successText: { fontSize: 14, fontWeight: '500', color: TEXT_LIGHT, textAlign: 'center', lineHeight: 21 },
});