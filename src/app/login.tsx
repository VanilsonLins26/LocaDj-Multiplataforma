import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator, Animated,
  Image,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../config/firebaseConfig';

const PRIMARY = '#8B5CF6';
const SUCCESS = '#14D88A';
const ERROR = '#EF4444';
const BG_DARK = '#000000ff';
const BORDER_DARK = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PLACEHOLDER_COLOR = '#52525B';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Preencha todos os campos.'); shake(); return;
    }
    if (!email.includes('@')) {
      setError('Digite um e-mail válido.'); shake(); return;
    }

    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      const role = userDoc.exists() ? userDoc.data()?.role : 'user';

      if (role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(tabs)/kits_list');
      }

    } catch (err: any) {
      console.log('Login error:', err.code, err.message);

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Erro ao entrar. Verifique seus dados e tente novamente.');
      }
      shake();
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
            <Ionicons name="arrow-back" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.logoContainer}>
            <Image source={require('../../assets/images/dj.gif')} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={styles.title}>Bem-vindo!</Text>
          <Text style={styles.subtitle}>Entre com seus dados para continuar</Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }], marginTop: 24 }}>
            <Text style={styles.label}>E-MAIL</Text>
            <View style={[styles.inputWrap, emailFocused && styles.inputFocused, !!error && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor={PLACEHOLDER_COLOR}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <Text style={styles.label}>SENHA</Text>
            <View style={[styles.inputWrap, passFocused && styles.inputFocused, !!error && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={PLACEHOLDER_COLOR}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={v => { setPassword(v); setError(''); }}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={TEXT_MUTED} />
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
  safe: { flex: 1, backgroundColor: BG_DARK },
  header: { paddingHorizontal: 24, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: BORDER_DARK, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, paddingHorizontal: 32, paddingTop: 16, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginBottom: 24, height: 160 },
  logo: { flex: 1, width: '100%' },
  title: { fontSize: 32, fontWeight: '700', color: TEXT_LIGHT, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: TEXT_MUTED, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: TEXT_LIGHT, letterSpacing: 1, marginBottom: 12, marginTop: 12 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: BORDER_DARK, paddingBottom: 12, marginBottom: 24 },
  inputFocused: { borderBottomColor: PRIMARY },
  inputError: { borderBottomColor: ERROR },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: TEXT_LIGHT, paddingVertical: 0 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -12, marginBottom: 12 },
  errorText: { fontSize: 13, color: ERROR },
  forgotWrap: { alignItems: 'flex-end', marginBottom: 32, marginTop: -8 },
  forgotText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
  btnPrimary: { backgroundColor: PRIMARY, borderRadius: 12, height: 56, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 32, gap: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER_DARK },
  dividerText: { fontSize: 13, color: TEXT_MUTED, fontWeight: '500' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText: { fontSize: 14, color: TEXT_MUTED },
  link: { fontSize: 14, color: TEXT_LIGHT, fontWeight: '600' },
});