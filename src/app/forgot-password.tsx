import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#5B4EE4';
const SUCCESS = '#14D88A';
const ERROR = '#EF4444';
const GRAY_100 = '#F3F4F6';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_900 = '#111827';

type Phase = 'email' | 'code' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const codeRefs = useRef<(TextInput | null)[]>([]);

  function handleCodeChange(index: number, value: string) {
    if (value.length > 1) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    setError('');
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
  }

  function handleCodeBackspace(index: number) {
    if (!code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
      const next = [...code];
      next[index - 1] = '';
      setCode(next);
    }
  }

  function handleBack() {
    setError('');
    if (phase === 'email') router.back();
    else if (phase === 'code') setPhase('email');
    else if (phase === 'reset') setPhase('code');
    else router.replace('/');
  }

  async function handleSendEmail() {
    if (!email.trim() || !email.includes('@')) { setError('Digite um e-mail válido.'); return; }
    setError(''); setLoading(true);
    try {
      // ↓↓↓ INTEGRAÇÃO Firebase Auth ↓↓↓
      // await sendPasswordResetEmail(auth, email);
      // setPhase('done'); // Firebase usa link direto, não OTP
      await new Promise(r => setTimeout(r, 1000));
      setPhase('code');
    } catch { setError('Erro ao enviar. Verifique o e-mail.'); }
    finally { setLoading(false); }
  }

  async function handleVerifyCode() {
    if (code.join('').length < 6) { setError('Digite o código completo.'); return; }
    setError(''); setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      setPhase('reset');
    } catch { setError('Código inválido ou expirado.'); }
    finally { setLoading(false); }
  }

  async function handleResetPassword() {
    if (newPassword.length < 6) { setError('Mínimo 6 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setError(''); setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setPhase('done');
    } catch { setError('Erro ao redefinir. Tente novamente.'); }
    finally { setLoading(false); }
  }

  const config = {
    email: { icon: 'mail-outline' as const,           iconBg: '#EEF2FF', iconColor: PRIMARY,  title: 'Recuperar senha',  sub: 'Informe seu e-mail cadastrado para receber o código de recuperação' },
    code:  { icon: 'chatbubble-outline' as const,     iconBg: '#EEF2FF', iconColor: PRIMARY,  title: 'Código enviado',   sub: `Enviamos um código de 6 dígitos para ${email}` },
    reset: { icon: 'lock-closed-outline' as const,    iconBg: '#EEF2FF', iconColor: PRIMARY,  title: 'Nova senha',       sub: 'Crie uma senha segura para sua conta' },
    done:  { icon: 'checkmark-circle-outline' as const, iconBg: 'rgba(20,216,138,0.1)', iconColor: SUCCESS, title: 'Senha redefinida!', sub: 'Sua senha foi alterada com sucesso.' },
  };
  const cfg = config[phase];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={GRAY_900} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Ícone */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: cfg.iconBg }]}>
              <Ionicons name={cfg.icon} size={36} color={cfg.iconColor} />
            </View>
            {/* Ícone de email com check (como no design para fase done/email enviado) */}
            {phase === 'code' && (
              <View style={styles.iconBadge}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.title}>{cfg.title}</Text>
          <Text style={styles.subtitle}>{cfg.sub}</Text>

          {/* ─── E-MAIL ─── */}
          {phase === 'email' && (
            <>
              <Text style={styles.label}>E-MAIL CADASTRADO</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={GRAY_500} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor={GRAY_300}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={v => { setEmail(v); setError(''); }}
                  autoFocus
                />
              </View>

              {error ? <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color={ERROR} /><Text style={styles.errorText}>{error}</Text></View> : null}

              <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleSendEmail} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Enviar código</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backLinkWrap} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8 }}>
                <Ionicons name="arrow-back" size={14} color={PRIMARY} style={{ marginRight: 4 }} />
                <Text style={styles.backLink}>Voltar ao login</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ─── CÓDIGO OTP ─── */}
          {phase === 'code' && (
            <>
              <View style={styles.codeRow}>
                {code.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={ref => { codeRefs.current[i] = ref; }}
                    style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                    value={digit}
                    onChangeText={v => handleCodeChange(i, v)}
                    onKeyPress={({ nativeEvent }) => nativeEvent.key === 'Backspace' && handleCodeBackspace(i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              {error ? <View style={[styles.errorRow, { justifyContent: 'center' }]}><Ionicons name="alert-circle-outline" size={14} color={ERROR} /><Text style={styles.errorText}>{error}</Text></View> : null}

              <Text style={styles.resendText}>
                Não recebeu o código?{'  '}
                <Text style={styles.resendLink} onPress={handleSendEmail}>Reenviar</Text>
              </Text>

              <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleVerifyCode} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Verificar código</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ─── NOVA SENHA ─── */}
          {phase === 'reset' && (
            <>
              <Text style={styles.label}>NOVA SENHA</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={GRAY_500} style={styles.inputIcon} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Mínimo 6 caracteres" placeholderTextColor={GRAY_300} secureTextEntry={!showPass} value={newPassword} onChangeText={v => { setNewPassword(v); setError(''); }} />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={GRAY_500} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>CONFIRMAR SENHA</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={GRAY_500} style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Repita a senha" placeholderTextColor={GRAY_300} secureTextEntry value={confirmPassword} onChangeText={v => { setConfirmPassword(v); setError(''); }} />
                {confirmPassword.length > 0 && (
                  <Ionicons
                    name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={newPassword === confirmPassword ? SUCCESS : ERROR}
                  />
                )}
              </View>

              {error ? <View style={styles.errorRow}><Ionicons name="alert-circle-outline" size={14} color={ERROR} /><Text style={styles.errorText}>{error}</Text></View> : null}

              <TouchableOpacity style={[styles.btnPrimary, loading && styles.btnDisabled]} onPress={handleResetPassword} disabled={loading} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Redefinir senha</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ─── SUCESSO ─── */}
          {phase === 'done' && (
            <>
              <View style={styles.successCard}>
                <Ionicons name="shield-checkmark-outline" size={28} color={SUCCESS} style={{ marginBottom: 8 }} />
                <Text style={styles.successText}>Sua conta está protegida com a nova senha</Text>
              </View>

              <TouchableOpacity style={styles.btnPrimary} onPress={() => router.replace('/')} activeOpacity={0.85}>
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
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: GRAY_100, alignItems: 'center', justifyContent: 'center' },

  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },

  iconContainer: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  iconBadge: {
    position: 'absolute', bottom: 0, right: '30%',
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: SUCCESS, borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },

  title: { fontSize: 24, fontWeight: '700', color: GRAY_900, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: GRAY_500, textAlign: 'center', marginBottom: 32, lineHeight: 21, paddingHorizontal: 8 },

  label: { fontSize: 11, fontWeight: '700', color: GRAY_900, letterSpacing: 0.8, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: GRAY_300, borderRadius: 14, backgroundColor: GRAY_100, paddingHorizontal: 14, marginBottom: 20, minHeight: 54 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: GRAY_900, paddingVertical: 14 },

  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  codeInput: {
    width: 50, height: 60, borderWidth: 2, borderColor: GRAY_300,
    borderRadius: 14, fontSize: 24, fontWeight: '700', color: GRAY_900,
    backgroundColor: GRAY_100, textAlign: 'center',
  },
  codeInputFilled: { borderColor: PRIMARY, backgroundColor: '#F5F3FF' },

  resendText: { fontSize: 14, color: GRAY_500, textAlign: 'center', marginBottom: 28 },
  resendLink: { color: PRIMARY, fontWeight: '700' },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -12, marginBottom: 16 },
  errorText: { fontSize: 13, color: ERROR },

  btnPrimary: { backgroundColor: PRIMARY, borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  backLinkWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  backLink: { fontSize: 14, color: PRIMARY, fontWeight: '600' },

  successCard: { backgroundColor: '#F0FDF9', borderWidth: 1, borderColor: 'rgba(20,216,138,0.2)', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 28 },
  successText: { fontSize: 14, fontWeight: '500', color: GRAY_900, textAlign: 'center', lineHeight: 21 },
});