import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { Feather, Ionicons } from '@expo/vector-icons';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, storage } from '../config/firebaseConfig';
import { Image, Modal, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

const AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Aneka&backgroundColor=c0aede',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Max&backgroundColor=ffdfbf',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Luna&backgroundColor=ffd5dc',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Leo&backgroundColor=d1d4f9',
  'https://api.dicebear.com/9.x/avataaars/png?seed=Mia&backgroundColor=b6e3f4'
];

export default function MeusDadosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [cpf, setCpf] = React.useState('***.123.456-**');
  const [avatar, setAvatar] = React.useState('');
  const [localPhotoUri, setLocalPhotoUri] = React.useState<string | null>(null);
  const [base64Data, setBase64Data] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = React.useState(false);

  React.useEffect(() => {
    async function fetchUser() {
      if (auth.currentUser) {
        setEmail(auth.currentUser.email || '');
        const docRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name || auth.currentUser.displayName || '');
          setPhone(data.phone || '');
          setAvatar(data.avatar || auth.currentUser.photoURL || '');
          if (data.cpf) setCpf(data.cpf);
        } else {
          setName(auth.currentUser.displayName || '');
        }
      }
    }
    fetchUser();
  }, []);

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
      base64: true,
    });

    if (!result.canceled) {
      setLocalPhotoUri(result.assets[0].uri);
      setAvatar(result.assets[0].uri); // Show preview
      setBase64Data(result.assets[0].base64 || null);
      setAvatarModalVisible(false);
    }
  };

  async function handleSave() {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      // 1. SALVAR DADOS BÁSICOS IMEDIATAMENTE
      const isCustomUpload = localPhotoUri && avatar === localPhotoUri;
      const docRef = doc(db, 'users', auth.currentUser.uid);
      
      await setDoc(docRef, {
        name,
        phone,
        // No Firestore guardamos o que já era oficial ou vazio, não o path local
        avatar: isCustomUpload ? (auth.currentUser.photoURL || '') : avatar
      }, { merge: true });

      // 2. ATUALIZAR PERFIL LOCAL (Visualização imediata no dispositivo)
      await updateProfile(auth.currentUser, { displayName: name, photoURL: avatar });

      // 3. UPLOAD DA FOTO (NÃO BLOQUEANTE)
      if (isCustomUpload && base64Data) {
        (async () => {
          try {
            const fileRef = ref(storage, `avatars/${auth.currentUser?.uid}`);
            await uploadString(fileRef, base64Data, 'base64');
            const downloadUrl = await getDownloadURL(fileRef);

            await setDoc(docRef, { avatar: downloadUrl }, { merge: true });
            await updateProfile(auth.currentUser!, { photoURL: downloadUrl });
            setLocalPhotoUri(null);
            setBase64Data(null);
            setAvatar(downloadUrl);
          } catch (uploadErr: any) {
            console.error("Erro no upload:", uploadErr);
          }
        })();
      }

      await updateProfile(auth.currentUser, { displayName: name, photoURL: finalAvatarUrl });
      alert('Dados atualizados com sucesso!');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'permission-denied') {
        alert('Sem permissão. Verifique as regras do Firestore no console do Firebase.');
      } else {
        alert('Erro ao atualizar dados.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Dados</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Sessão do Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setAvatarModalVisible(true)}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {name ? name.substring(0, 2).toUpperCase() : 'US'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setAvatarModalVisible(true)}>
              <Text style={styles.changePhotoText}>Alterar foto</Text>
            </TouchableOpacity>
          </View>

          {/* Formulário */}
          <View style={styles.formContainer}>

            {/* Nome Completo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome completo"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* E-mail */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { color: '#9CA3AF' }]}
                  value={email}
                  editable={false}
                  placeholder="Seu e-mail"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Celular / WhatsApp */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Celular / WhatsApp</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* CPF */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF</Text>
              <View style={[styles.inputContainer, styles.inputDisabled]}>
                <TextInput
                  style={[styles.input, { color: '#9CA3AF' }]}
                  value={cpf}
                  editable={false}
                />
                <Feather name="lock" size={16} color="#9CA3AF" style={styles.inputIconRight} />
              </View>
            </View>

          </View>

        </ScrollView>

        {/* Botão Salvar Rodapé */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar Alterações'}</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

      {/* Modal de Seleção de Avatar */}
      <Modal visible={avatarModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha um Avatar</Text>
              <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.avatarGrid}>
              {/* Option to Upload */}
              <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                <View style={styles.uploadIconCircle}>
                  <Ionicons name="camera" size={30} color="#5B42F3" />
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
              <Text style={styles.removeAvatarText}>Remover Foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F9', // Cinza bem claro do fundo
  },
  header: {
    backgroundColor: '#5B42F3',
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
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 32,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0FCE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B42F3',
  },
  formContainer: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
  },
  inputDisabled: {
    backgroundColor: '#F9FAFB',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    height: '100%',
  },
  inputIconRight: {
    marginLeft: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#F7F7F9',
  },
  saveButton: {
    backgroundColor: '#5B42F3',
    borderRadius: 100,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#5B42F3',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  avatarOptionSelected: {
    borderColor: '#5B42F3',
  },
  avatarOptionImg: {
    width: '100%',
    height: '100%',
  },
  removeAvatarBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  removeAvatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
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
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 4,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B42F3',
  },
});
