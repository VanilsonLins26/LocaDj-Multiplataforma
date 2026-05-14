import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db, storage } from '../config/firebaseConfig';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { Image, Modal, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Max&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Luna&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Leo&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Mia&backgroundColor=b6e3f4'
];



const PRIMARY = '#5B4EE4';
const SUCCESS = '#14D88A';
const ERROR = '#EF4444';
const GRAY_100 = '#F3F4F6';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_900 = '#111827';

function getStrength(p: string): { bars: number; label: string; color: string } {
  if (!p) return { bars: 0, label: '', color: GRAY_300 };
  if (p.length < 4) return { bars: 1, label: 'Muito fraca', color: ERROR };
  if (p.length < 6) return { bars: 2, label: 'Fraca', color: '#F97316' };
  if (p.length < 8) return { bars: 3, label: 'Boa', color: '#EAB308' };
  return { bars: 4, label: 'Forte', color: SUCCESS };
}


export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const strength = getStrength(password);

  function validateStep1(): boolean {
    if (!name.trim()) { setError('Informe seu nome completo.'); return false; }
    if (!email.trim() || !email.includes('@')) { setError('E-mail inválido.'); return false; }
    if (!phone.trim()) { setError('Informe o telefone.'); return false; }
    setError(''); return true;
  }

  function validateStep2(): boolean {
    if (password.length < 6) { setError('Mínimo 6 caracteres.'); return false; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return false; }
    if (!accepted) { setError('Aceite os termos para continuar.'); return false; }
    setError(''); return true;
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
      base64: true, // Adicionado aqui
    });

    if (!result.canceled) {
      setLocalPhotoUri(result.assets[0].uri);
      setAvatar(result.assets[0].uri); // Show preview
      setBase64Data(result.assets[0].base64 || null); // Guardar o base64
      setAvatarModalVisible(false);
    }
  };

  async function handleRegister() {
    if (!validateStep2()) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const isCustomUpload = localPhotoUri && avatar === localPhotoUri;

      // 1. SALVAR IMEDIATAMENTE NO FIRESTORE (Dados básicos)
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        phone,
        avatar: isCustomUpload ? '' : avatar, // Firestore não aceita path local, salvamos vazio
        role: 'user',
        createdAt: new Date().toISOString()
      });

      // 2. ATUALIZAR PERFIL LOCAL (Para visualização imediata)
      await updateProfile(user, { displayName: name, photoURL: avatar });

      // 3. INICIAR UPLOAD EM SEGUNDO PLANO
      if (isCustomUpload && base64Data) {
        (async () => {
          try {
            const fileRef = ref(storage, `avatars/${user.uid}`);
            await uploadString(fileRef, base64Data, 'base64');
            const downloadUrl = await getDownloadURL(fileRef);

            // Atualizar Firestore e Perfil
            await setDoc(doc(db, 'users', user.uid), { avatar: downloadUrl }, { merge: true });
            await updateProfile(user, { photoURL: downloadUrl });
          } catch (uploadErr: any) {
            console.error("Erro no upload em segundo plano:", uploadErr);
          }
        })();
      }

      router.replace('/(tabs)/kits_list');

    } catch (err: any) {
      console.error(err);
      let msg = 'Erro ao criar conta. Verifique sua conexão.';
      if (err.code === 'auth/email-already-in-use') msg = 'Este e-mail já está cadastrado.';
      else if (err.code === 'auth/invalid-email') msg = 'O formato do e-mail é inválido.';
      else if (err.message) msg = `Erro: ${err.message}`;
      
      Alert.alert("Ops!", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const steps = [{ label: 'Dados' }, { label: 'Segurança' }];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { setError(''); step > 1 ? setStep(step - 1) : router.back(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={GRAY_900} />
          </TouchableOpacity>

          <View style={styles.stepsRow}>
            {steps.map((s, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <React.Fragment key={n}>
                  <View style={styles.stepItem}>
                    <View style={[styles.stepCircle, active && styles.stepActive, done && styles.stepDone]}>
                      {done
                        ? <Ionicons name="checkmark" size={13} color="#fff" />
                        : <Text style={[styles.stepNum, (active || done) && { color: '#fff' }]}>{n}</Text>
                      }
                    </View>
                    <Text style={[styles.stepLabel, active && { color: PRIMARY }]}>{s.label}</Text>
                  </View>
                  {i < steps.length - 1 && (
                    <View style={[styles.stepLine, done && { backgroundColor: SUCCESS }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setAvatarModalVisible(true)}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.iconCircle}>
                  <Ionicons name="person-outline" size={36} color={PRIMARY} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setAvatarModalVisible(true)} style={{ marginTop: 8 }}>
              <Text style={styles.changePhotoText}>{avatar ? 'Alterar avatar' : 'Escolher avatar'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Criar conta</Text>
          <Text style={styles.subtitle}>Preencha seus dados para começar</Text>

          {/* ─── PASSO 1 ─── */}
          {step === 1 && (
            <>
              <Text style={styles.label}>NOME COMPLETO</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={GRAY_500} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu nome completo"
                  placeholderTextColor={GRAY_300}
                  value={name}
                  onChangeText={v => { setName(v); setError(''); }}
                />
              </View>

              <Text style={styles.label}>E-MAIL</Text>
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
                />
              </View>

              <Text style={styles.label}>TELEFONE</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color={GRAY_500} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor={GRAY_300}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={v => { setPhone(v); setError(''); }}
                />
              </View>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={ERROR} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => validateStep1() && setStep(2)}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </>
          )}

          {/* ─── PASSO 2 ─── */}
          {step === 2 && (
            <>
              <Text style={styles.label}>SENHA</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={GRAY_500} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={GRAY_300}
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={v => { setPassword(v); setError(''); }}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={GRAY_500} />
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View style={styles.strengthWrap}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map(i => (
                      <View key={i} style={[styles.strengthBar, { backgroundColor: i <= strength.bars ? strength.color : GRAY_300 }]} />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}

              <Text style={styles.label}>CONFIRMAR SENHA</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={GRAY_500} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repita a senha"
                  placeholderTextColor={GRAY_300}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={v => { setConfirmPassword(v); setError(''); }}
                />
                {confirmPassword.length > 0 && (
                  <Ionicons
                    name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                    size={18}
                    color={password === confirmPassword ? SUCCESS : ERROR}
                  />
                )}
              </View>

              <TouchableOpacity style={styles.checkRow} onPress={() => setAccepted(!accepted)} activeOpacity={0.7}>
                <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
                  {accepted && <Ionicons name="checkmark" size={13} color="#fff" />}
                </View>
                <Text style={styles.checkText}>
                  Li e aceito os{' '}
                  <Text style={{ color: PRIMARY, fontWeight: '600' }}>Termos de Uso</Text>
                  {' '}e a{' '}
                  <Text style={{ color: PRIMARY, fontWeight: '600' }}>Política de Privacidade</Text>
                </Text>
              </TouchableOpacity>

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle-outline" size={14} color={ERROR} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.btnPrimary, (!accepted || loading) && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={!accepted || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnText}>Criar minha conta</Text>
                }
              </TouchableOpacity>
            </>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
            <Text style={{ fontSize: 15, color: GRAY_500 }}>Já tem conta? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')} hitSlop={{ top: 8, bottom: 8 }}>
              <Text style={{ fontSize: 15, color: PRIMARY, fontWeight: '700' }}>Entrar</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Seleção de Avatar */}
      <Modal visible={avatarModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha um Avatar</Text>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                <Ionicons name="close" size={24} color={GRAY_500} />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarGrid}>
              {/* Option to Upload */}
              <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="camera" size={30} color={PRIMARY} />
                </View>
                <Text style={styles.uploadText}>Upload</Text>
              </TouchableOpacity>

              {AVATARS.map((url, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.avatarOption, avatar === url && !localPhotoUri && styles.avatarOptionSelected]}
                  onPress={() => { setAvatar(url); setLocalPhotoUri(null); setAvatarModalVisible(false); }}
                >
                  <Image source={{ uri: url }} style={styles.avatarOptionImg} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.removeAvatarBtn} onPress={() => { setAvatar(''); setLocalPhotoUri(null); setAvatarModalVisible(false); }}>
              <Text style={styles.removeAvatarText}>Continuar sem Foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: GRAY_100, alignItems: 'center', justifyContent: 'center' },

  stepsRow: { flexDirection: 'row', alignItems: 'center' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: GRAY_100, alignItems: 'center', justifyContent: 'center' },
  stepActive: { backgroundColor: PRIMARY },
  stepDone: { backgroundColor: SUCCESS },
  stepNum: { fontSize: 12, fontWeight: '700', color: GRAY_500 },
  stepLabel: { fontSize: 10, color: GRAY_500, fontWeight: '600' },
  stepLine: { width: 32, height: 2, backgroundColor: GRAY_300, marginHorizontal: 6, marginBottom: 14 },

  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 24, paddingBottom: 40 },

  iconContainer: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 24, fontWeight: '700', color: GRAY_900, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: GRAY_500, textAlign: 'center', marginBottom: 32, lineHeight: 20 },

  label: { fontSize: 11, fontWeight: '700', color: GRAY_900, letterSpacing: 0.8, marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: GRAY_300, borderRadius: 14, backgroundColor: GRAY_100, paddingHorizontal: 14, marginBottom: 20, minHeight: 54 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: GRAY_900, paddingVertical: 14 },

  strengthWrap: { marginTop: -12, marginBottom: 20 },
  strengthBars: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600' },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: GRAY_300, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  checkText: { fontSize: 13, color: GRAY_500, lineHeight: 20, flex: 1 },

  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: -8, marginBottom: 16 },
  errorText: { fontSize: 13, color: ERROR, flex: 1, lineHeight: 18 },

  btnPrimary: { backgroundColor: PRIMARY, borderRadius: 16, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: PRIMARY, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: PRIMARY },
  changePhotoText: { fontSize: 13, fontWeight: '600', color: PRIMARY },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: GRAY_900 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 20 },
  avatarOption: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: 'transparent', overflow: 'hidden' },
  avatarOptionSelected: { borderColor: PRIMARY },
  avatarOptionImg: { width: '100%', height: '100%' },
  removeAvatarBtn: { alignItems: 'center', paddingVertical: 12 },
  removeAvatarText: { fontSize: 15, fontWeight: '600', color: GRAY_500 },
  uploadOption: {
    width: 70,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: GRAY_300,
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY,
  },
});