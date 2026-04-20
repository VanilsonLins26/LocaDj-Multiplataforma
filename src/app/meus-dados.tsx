import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebaseConfig';

export default function MeusDadosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [cpf, setCpf] = React.useState('***.123.456-**');
  const [saving, setSaving] = React.useState(false);

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
          if (data.cpf) setCpf(data.cpf);
        } else {
          setName(auth.currentUser.displayName || '');
        }
      }
    }
    fetchUser();
  }, []);

  async function handleSave() {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, {
        name,
        phone,
      });
      alert('Dados atualizados com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao atualizar dados.');
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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {name ? name.substring(0, 2).toUpperCase() : 'US'}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
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
});
