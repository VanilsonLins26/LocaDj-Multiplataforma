import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Animated,
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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused]   = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Preencha todos os campos.'); shake(); return;
    }
    if (!email.includes('@')) {
      setError('Digite um e-mail válido.'); shake(); return;
    }
    setError(''); setLoading(true);
    try {
      // ↓↓↓ INTEGRAÇÃO Firebase Auth ↓↓↓
      // const { user } = await signInWithEmailAndPassword(auth, email, password);
      // const userDoc = await getDoc(doc(db, 'users', user.uid));
      // const role = userDoc.data()?.role ?? 'user';
      // if (role === 'admin') router.replace('/dashboard');
      // else router.replace('/');  // TODO: trocar para '/home' quando a tela for criada
      await new Promise(r => setTimeout(r, 1000));
      router.replace('/');  // TODO: trocar para '/home' quando a tela for criada
    } catch {
      setError('E-mail ou senha incorretos.'); shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={GRAY_900} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={36} color={PRIMARY} />
            </View>
          </View>

          <Text style={styles.title}>Bem-vindo!</Text>
          <Text style={styles.subtitle}>Entre com seus dados para continuar</Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <Text style={styles.label}>E-MAIL</Text>
            <View style={[styles.inputWrap, emailFocused && styles.inputFocused, !!error && styles.inputError]}>
              <Ionicons name="mail-outline" size={18} color={emailFocused ? PRIMARY : GRAY_500} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={GRAY_300}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              {email.length > 0 && email.includes('@') && (
                <Ionicons name="checkmark-circle" size={18} color={SUCCESS} />
              )}
            </View>

            <Text style={styles.label}>SENHA</Text>
            <View style={[styles.inputWrap, passFocused && styles.inputFocused, !!error && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={18} color={passFocused ? PRIMARY : GRAY_500} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={GRAY_300}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={GRAY_500} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={ERROR} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </Animated.View>

          <TouchableOpacity style={styles.forgotWrap} onPress={() => router.push('/forgot-password')} hitSlop={{ top: 8, bottom: 8 }}>
            <Text style={styles.forgotText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnPrimary, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Entrar</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/register')} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={styles.link}>Criar conta</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#fff' },
  header:      { paddingHorizontal: 20, paddingVertical: 12 },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: GRAY_100, alignItems: 'center', justifyContent: 'center' },
  scroll:      { flexGrow: 1, paddingHorizontal: 28, paddingTop: 16, paddingBottom: 40 },
  iconContainer: { alignItems: 'center', marginBottom: 28 },
  iconCircle:    { width: 88, height: 88, borderRadius: 44, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  title:         { fontSize: 26, fontWeight: '700', color: GRAY_900, textAlign: 'center', marginBottom: 8 },
  subtitle:      { fontSize: 15, color: GRAY_500, textAlign: 'center', marginBottom: 36, lineHeight: 22 },
  label:         { fontSize: 11, fontWeight: '700', color: GRAY_900, letterSpacing: 0.8, marginBottom: 8 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: GRAY_300, borderRadius: 14, backgroundColor: GRAY_100, paddingHorizontal: 14, marginBottom: 20, minHeight: 54 },
  inputFocused:  { borderColor: PRIMARY, backgroundColor: '#F5F3FF' },
  inputError:    { borderColor: ERROR },
  inputIcon:     { marginRight: 10 },
  input:         { flex: 1, fontSize: 15, color: GRAY_900, paddingVertical: 14 },
  errorRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -12, marginBottom: 12 },
  errorText:     { fontSize: 13, color: ERROR },
  forgotWrap:    { alignItems: 'flex-end', marginBottom: 28 },
  forgotText:    { fontSize: 14, color: PRIMARY, fontWeight: '600' },
  btnPrimary:    { backgroundColor: PRIMARY, borderRadius: 16, height: 54, alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  btnDisabled:   { opacity: 0.6 },
  btnText:       { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  divider:       { flexDirection: 'row', alignItems: 'center', marginVertical: 28, gap: 12 },
  dividerLine:   { flex: 1, height: 1, backgroundColor: GRAY_300 },
  dividerText:   { fontSize: 13, color: GRAY_500, fontWeight: '500' },
  bottomRow:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText:    { fontSize: 15, color: GRAY_500 },
  link:          { fontSize: 15, color: PRIMARY, fontWeight: '700' },
});