import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY  = '#5B4EE4';
const SUCCESS  = '#14D88A';
const ERROR    = '#EF4444';
const GRAY_100 = '#F3F4F6';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_900 = '#111827';

export default function ConfirmEmailScreen() {
  const router = useRouter();
  const [code, setCode]       = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);
  const codeRefs = useRef<(TextInput | null)[]>([]);

  function handleChange(i: number, v: string) {
    if (v.length > 1) return;
    const next = [...code]; next[i] = v; setCode(next); setError('');
    if (v && i < 5) codeRefs.current[i + 1]?.focus();
  }

  function handleBackspace(i: number) {
    if (!code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
      const next = [...code]; next[i - 1] = ''; setCode(next);
    }
  }

  async function handleVerify() {
    if (code.join('').length < 6) { setError('Digite os 6 dígitos do código.'); return; }
    setError(''); setLoading(true);
    try {
      // ↓↓↓ INTEGRAÇÃO Firebase Auth ↓↓↓
      // await applyActionCode(auth, code.join(''));
      await new Promise(r => setTimeout(r, 800));
      setDone(true);
    } catch {
      setError('Código inválido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    // ↓↓↓ INTEGRAÇÃO Firebase Auth ↓↓↓
    // await sendEmailVerification(auth.currentUser);
    setCode(['', '', '', '', '', '']);
    setError('');
    setTimeout(() => codeRefs.current[0]?.focus(), 100);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={styles.header}>
          {!done && (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="arrow-back" size={22} color={GRAY_900} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, done && styles.iconCircleDone]}>
              <Ionicons name={done ? 'checkmark-circle' : 'mail-outline'} size={36} color={done ? SUCCESS : PRIMARY} />
            </View>
            {!done && (
              <View style={styles.iconBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.title}>{done ? 'E-mail confirmado!' : 'Confirme seu e-mail'}</Text>
          <Text style={styles.subtitle}>
            {done
              ? 'Sua conta está ativa. Bem-vindo ao LocaD!'
              : 'Enviamos um código de 6 dígitos para o seu e-mail. Digite abaixo para confirmar sua conta.'}
          </Text>

          {!done ? (
            <>
              <View style={styles.codeRow}>
                {code.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { codeRefs.current[i] = ref; }}
                    style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                    value={digit}
                    onChangeText={v => handleChange(i, v)}
                    onKeyPress={({ nativeEvent }) => nativeEvent.key === 'Backspace' && handleBackspace(i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={ERROR} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.resendText}>
                Não recebeu o código?{'  '}
                <Text style={styles.resendLink} onPress={handleResend}>Reenviar</Text>
              </Text>

              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <><Ionicons name="checkmark-circle-outline" size={18} color="#fff" style={{ marginRight: 8 }} /><Text style={styles.btnText}>Confirmar e-mail</Text></>
                }
              </TouchableOpacity>

              <View style={styles.infoCard}>
                <Ionicons name="information-circle-outline" size={18} color={PRIMARY} style={{ marginTop: 1 }} />
                <Text style={styles.infoText}>Verifique também a caixa de spam. O código expira em 10 minutos.</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.successCard}>
                <Ionicons name="shield-checkmark-outline" size={28} color={SUCCESS} style={{ marginBottom: 10 }} />
                <Text style={styles.successTitle}>Conta verificada</Text>
                <Text style={styles.successSub}>Agora você tem acesso completo à plataforma</Text>
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/login')} activeOpacity={0.85}>
                <Text style={styles.btnText}>Ir para o login</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#fff' },
  header:        { paddingHorizontal: 20, paddingVertical: 12, minHeight: 64 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: GRAY_100, alignItems: 'center', justifyContent: 'center' },
  scroll:        { flexGrow: 1, paddingHorizontal: 28, paddingTop: 8, paddingBottom: 40 },
  iconContainer: { alignItems: 'center', marginBottom: 28, position: 'relative' },
  iconCircle:    { width: 96, height: 96, borderRadius: 48, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  iconCircleDone:{ backgroundColor: 'rgba(20,216,138,0.1)' },
  iconBadge:     { position: 'absolute', bottom: 2, right: '28%', width: 26, height: 26, borderRadius: 13, backgroundColor: SUCCESS, borderWidth: 2.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: 24, fontWeight: '700', color: GRAY_900, textAlign: 'center', marginBottom: 10 },
  subtitle:      { fontSize: 14, color: GRAY_500, textAlign: 'center', marginBottom: 36, lineHeight: 21, paddingHorizontal: 8 },
  codeRow:       { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 20 },
  codeInput:     { width: 50, height: 62, borderWidth: 2, borderColor: GRAY_300, borderRadius: 14, fontSize: 24, fontWeight: '700', color: GRAY_900, backgroundColor: GRAY_100, textAlign: 'center' },
  codeInputFilled:{ borderColor: PRIMARY, backgroundColor: '#F5F3FF' },
  errorRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginBottom: 16 },
  errorText:     { fontSize: 13, color: ERROR },
  resendText:    { fontSize: 14, color: GRAY_500, textAlign: 'center', marginBottom: 28 },
  resendLink:    { color: PRIMARY, fontWeight: '700' },
  btnPrimary:    { backgroundColor: PRIMARY, borderRadius: 16, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6, marginBottom: 12 },
  btnDisabled:   { opacity: 0.6 },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700' },
  infoCard:      { flexDirection: 'row', gap: 10, backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14 },
  infoText:      { flex: 1, fontSize: 13, color: GRAY_900, lineHeight: 19 },
  successCard:   { backgroundColor: '#F0FDF9', borderWidth: 1, borderColor: 'rgba(20,216,138,0.2)', borderRadius: 16, padding: 28, alignItems: 'center', marginBottom: 28 },
  successTitle:  { fontSize: 16, fontWeight: '700', color: GRAY_900, marginBottom: 6 },
  successSub:    { fontSize: 13, color: GRAY_500, textAlign: 'center', lineHeight: 19 },
});