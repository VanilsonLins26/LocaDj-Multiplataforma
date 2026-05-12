import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const PRIMARY = '#5145CD';
const WHITE = '#FFFFFF';
const BG = '#F4F5F8';

// --- Password Requirements ---
interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Pelo menos uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Pelo menos um número', test: (p) => /[0-9]/.test(p) },
  { label: 'Pelo menos um caractere especial', test: (p) => /[^a-zA-Z0-9]/.test(p) },
];

// --- Helper: Password input ---
interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasFocus?: boolean;
}

function PasswordField({ label, value, onChange, placeholder, hasFocus }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, hasFocus && styles.inputContainerFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? '••••••••'}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setVisible((v) => !v)} activeOpacity={0.7} style={styles.eyeButton}>
          <Feather name={visible ? 'eye' : 'eye-off'} size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = novaSenha.length > 0 && novaSenha === confirmarSenha;
  const allRequirementsMet = novaSenha.length > 0 && REQUIREMENTS.every((r) => r.test(novaSenha));
  const canSave = senhaAtual.length > 0 && allRequirementsMet && passwordsMatch && !loading;

  const handleChangePassword = async () => {
    if (!canSave) return;
    
    const user = auth.currentUser;
    if (!user || !user.email) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(user.email, senhaAtual);
      
      // Reautenticar o usuário
      await reauthenticateWithCredential(user, credential);
      
      // Atualizar a senha
      await updatePassword(user, novaSenha);
      
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        Alert.alert('Erro', 'A senha atual está incorreta.');
      } else {
        Alert.alert('Erro', 'Ocorreu um erro ao alterar a senha. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Ionicons name="lock-closed-outline" size={24} color={WHITE} style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}>Mudar Senha</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.description}>
            Mantenha sua conta de administrador segura atualizando sua senha regularmente.
          </Text>

          {/* Senha Atual */}
          <PasswordField
            label="Senha Atual"
            value={senhaAtual}
            onChange={setSenhaAtual}
            placeholder="Digite sua senha atual"
          />

          {/* Nova Senha */}
          <PasswordField
            label="Nova Senha"
            value={novaSenha}
            onChange={setNovaSenha}
            placeholder="Digite sua nova senha"
            hasFocus={novaSenha.length > 0}
          />

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            {REQUIREMENTS.map((req) => {
              const met = novaSenha.length > 0 && req.test(novaSenha);
              return (
                <View key={req.label} style={styles.requirementRow}>
                  <View style={[styles.dot, met ? styles.dotGreen : styles.dotGray]} />
                  <Text style={[styles.requirementText, met && styles.requirementTextMet]}>
                    {req.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Confirmar Nova Senha */}
          <PasswordField
            label="Confirmar Nova Senha"
            value={confirmarSenha}
            onChange={setConfirmarSenha}
            placeholder="Repita sua nova senha"
            hasFocus={confirmarSenha.length > 0}
          />

          {/* Match indicator */}
          {confirmarSenha.length > 0 && (
            <View style={styles.requirementRow}>
              <View style={[styles.dot, passwordsMatch ? styles.dotGreen : styles.dotRed]} />
              <Text style={[styles.requirementText, passwordsMatch && styles.requirementTextMet]}>
                {passwordsMatch ? 'As senhas coincidem' : 'As senhas não coincidem'}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) + 70 }]}>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            activeOpacity={canSave ? 0.8 : 1}
            disabled={!canSave}
            onPress={handleChangePassword}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={styles.saveButtonText}>Salvar Nova Senha</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: WHITE,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 22,
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 28,
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerFocused: {
    borderColor: PRIMARY,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  requirementsContainer: {
    marginTop: -8,
    marginBottom: 24,
    gap: 8,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#14D88A',
  },
  dotGray: {
    backgroundColor: '#E2E3E8',
  },
  dotRed: {
    backgroundColor: '#EF4444',
  },
  requirementText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  requirementTextMet: {
    color: '#374151',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: BG,
  },
  saveButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C4BFFA',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: WHITE,
  },
});
