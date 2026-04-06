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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

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

// --- Main Screen ---

export default function AlterarSenhaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const passwordsMatch = novaSenha.length > 0 && novaSenha === confirmarSenha;
  const allRequirementsMet = novaSenha.length > 0 && REQUIREMENTS.every((r) => r.test(novaSenha));
  const canSave = senhaAtual.length > 0 && allRequirementsMet && passwordsMatch;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alterar Senha</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            activeOpacity={canSave ? 0.8 : 1}
            disabled={!canSave}
          >
            <Text style={styles.saveButtonText}>Salvar Nova Senha</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F9',
  },
  header: {
    backgroundColor: '#5245F1',
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
    fontWeight: '700',
    color: '#FFF',
  },

  // Form
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
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainerFocused: {
    borderColor: '#5245F1',
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

  // Requirements
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

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: '#F4F4F9',
  },
  saveButton: {
    backgroundColor: '#5245F1',
    borderRadius: 100,
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
    color: '#FFF',
  },
});
