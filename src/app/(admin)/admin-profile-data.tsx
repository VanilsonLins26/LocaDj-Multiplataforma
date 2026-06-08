import { Feather, Ionicons } from '@expo/vector-icons';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';
const ERROR = '#EF4444';

const API_BASE = 'https://locadj.onrender.com/api';

export default function AdminProfileDataScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [initial, setInitial] = useState('A');

  const [nameFocused, setNameFocused] = useState(false);
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const originalName = useRef('');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const n = user.displayName || '';
      originalName.current = n;
      setName(n);
      setEmail(user.email || '');
      setEmailVerified(user.emailVerified);
      setInitial((user.displayName || user.email || 'A')[0].toUpperCase());
    }
  }, []);

  useEffect(() => {
    setHasChanges(name.trim() !== originalName.current);
    if (name.trim()) setNameError('');
  }, [name]);

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError('Nome é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Usuário não autenticado');

      // 1. Update Firebase display name
      await updateProfile(user, { displayName: name.trim() });

      // 2. Try to update on backend (non-blocking)
      try {
        const headers = await getAuthHeader();
        await fetch(`${API_BASE}/admin/profile`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name: name.trim() }),
        });
      } catch {
        // Backend update is optional — Firebase is the source of truth
      }

      originalName.current = name.trim();
      setInitial(name.trim()[0].toUpperCase());
      setHasChanges(false);

      Alert.alert('Sucesso!', 'Dados atualizados com sucesso.', [
        { text: 'OK' },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Não foi possível atualizar os dados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={ {flex: 1, backgroundColor: BG}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus dados</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{initial}</Text>
          </View>
          <View style={styles.adminBadge}>
            <Feather name="shield" size={12} color={PRIMARY} />
            <Text style={styles.adminBadgeText}>Administrador</Text>
          </View>
        </View>

        {/* Personal Data */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações Pessoais</Text>

          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Nome <Text style={{ color: ERROR }}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrap,
                nameFocused && styles.inputFocused,
                nameError ? styles.inputError : null,
              ]}
            >
              <Feather
                name="user"
                size={16}
                color={nameFocused ? PRIMARY : TEXT_MUTED}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome completo"
                placeholderTextColor={TEXT_MUTED}
                autoCapitalize="words"
                returnKeyType="done"
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
              {name.trim().length > 0 && name !== originalName.current && (
                <View style={styles.changedDot} />
              )}
            </View>
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
          </View>
        </View>

        {/* Access Data */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados de Acesso</Text>

          {/* Email Field (read-only) */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={[styles.inputWrap, styles.inputReadOnly]}>
              <Feather name="mail" size={16} color={TEXT_MUTED} style={styles.inputIcon} />
              <Text style={styles.readOnlyText} numberOfLines={1}>
                {email || '—'}
              </Text>
              <Feather name="lock" size={14} color="#3F3F46" />
            </View>
            <Text style={styles.fieldHint}>
              O e-mail não pode ser alterado por aqui.
            </Text>
          </View>

          {/* Email verification status */}
          <View style={styles.verificationRow}>
            {emailVerified ? (
              <>
                <View style={[styles.verifiedDot, { backgroundColor: '#10B981' }]} />
                <Text style={[styles.verificationText, { color: '#10B981' }]}>
                  E-mail verificado
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.verifiedDot, { backgroundColor: ERROR }]} />
                <Text style={[styles.verificationText, { color: ERROR }]}>
                  E-mail não verificado
                </Text>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!hasChanges || saving) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color={TEXT_LIGHT} />
          ) : (
            <>
              <Feather name="save" size={18} color={(!hasChanges || saving) ? TEXT_MUTED : PRIMARY} />
              <Text style={[styles.saveBtnText, (!hasChanges || saving) && { color: TEXT_MUTED }]}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BORDER,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },

  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 20 },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#18181B',
    borderWidth: 2,
    borderColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: PRIMARY,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
  },

  // Card
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  // Fields
  fieldGroup: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    height: 48,
  },
  inputFocused: { borderColor: PRIMARY },
  inputError: { borderColor: ERROR },
  inputReadOnly: {
    backgroundColor: CARD_BG,
    borderColor: BORDER,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT_LIGHT,
    height: '100%',
  },
  readOnlyText: {
    flex: 1,
    fontSize: 15,
    color: TEXT_MUTED,
  },
  changedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  errorText: {
    fontSize: 12,
    color: ERROR,
    marginTop: 4,
    marginLeft: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 4,
    marginLeft: 4,
  },

  // Verification row
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  verifiedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verificationText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  saveBtn: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  saveBtnDisabled: {
    borderColor: '#3F3F46',
  },
  saveBtnText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
});
