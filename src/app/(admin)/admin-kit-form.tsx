import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';

const PRIMARY = '#5245F1';
const BG = '#F4F4F9';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#040417';
const TEXT_LIGHT = '#6B7280';
const BORDER = '#E5E7EB';
const BORDER_FOCUS = PRIMARY;
const ERROR = '#EF4444';

const API_BASE = 'https://locadj.onrender.com/api';

interface KitForm {
  name: string;
  description: string;
  pricePerDay: string;
  quantity: string;
  imageUrl: string;
  availability: boolean;
}

interface FieldError {
  name?: string;
  description?: string;
  pricePerDay?: string;
  quantity?: string;
}

export default function AdminKitFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kitId } = useLocalSearchParams<{ kitId?: string }>();
  const isEditing = Boolean(kitId);

  const [form, setForm] = useState<KitForm>({
    name: '',
    description: '',
    pricePerDay: '',
    quantity: '',
    imageUrl: '',
    availability: true,
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Refs for next field focus
  const descRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const quantityRef = useRef<TextInput>(null);
  const imageRef = useRef<TextInput>(null);

  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Fetch existing kit data if editing ou limpa o form se for novo
  useEffect(() => {
    if (!isEditing || !kitId) {
      setForm({
        name: '',
        description: '',
        pricePerDay: '',
        quantity: '',
        imageUrl: '',
        availability: true,
      });
      setErrors({});
      setLoading(false);
      return;
    }

    const fetchKit = async () => {
      try {
        const headers = await getAuthHeader();
        const resp = await fetch(`${API_BASE}/kits/${kitId}`, { headers });
        if (!resp.ok) throw new Error('Falha ao buscar kit');
        const data = await resp.json();
        setForm({
          name: data.name ?? '',
          description: data.description ?? '',
          pricePerDay: data.pricePerDay ? String(data.pricePerDay) : '',
          quantity: data.quantity ? String(data.quantity) : '',
          imageUrl: data.imageUrl ?? '',
          availability: data.availability ?? true,
        });
      } catch {
        Alert.alert('Erro', 'Não foi possível carregar os dados do kit.', [
          { text: 'OK', onPress: () => router.replace('/(admin)/kits') },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchKit();
  }, [isEditing, kitId]);

  const validate = (): boolean => {
    const newErrors: FieldError = {};
    if (!form.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!form.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!form.pricePerDay.trim()) {
      newErrors.pricePerDay = 'Preço é obrigatório';
    } else if (isNaN(Number(form.pricePerDay.replace(',', '.'))) || Number(form.pricePerDay.replace(',', '.')) <= 0) {
      newErrors.pricePerDay = 'Informe um preço válido';
    }
    if (!form.quantity.trim()) {
      newErrors.quantity = 'Quantidade é obrigatória';
    } else if (isNaN(Number(form.quantity)) || Number(form.quantity) < 1) {
      newErrors.quantity = 'Informe uma quantidade válida (mínimo 1)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof KitForm, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FieldError]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const headers = await getAuthHeader();
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        pricePerDay: Number(form.pricePerDay.replace(',', '.')),
        quantity: Number(form.quantity),
        imageUrl: form.imageUrl.trim() || null,
        availability: form.availability,
      };

      const url = isEditing
        ? `${API_BASE}/kits/${kitId}`
        : `${API_BASE}/kits`;
      const method = isEditing ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        throw new Error(errData?.message || 'Erro ao salvar kit');
      }

      Alert.alert(
        'Sucesso!',
        isEditing ? 'Kit atualizado com sucesso.' : 'Kit criado com sucesso.',
        [{ text: 'OK', onPress: () => router.replace('/(admin)/kits') }]
      );
    } catch (err: any) {
      Alert.alert('Erro', err?.message || 'Não foi possível salvar o kit. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Carregando dados do kit...</Text>
      </View>
    );
  }

  const imagePreviewUri = form.imageUrl.trim().startsWith('http')
    ? form.imageUrl.trim()
    : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(admin)/kits')}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={24} color={WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Kit' : 'Novo Kit'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imagem do Kit</Text>

          <View style={styles.imagePreviewWrap}>
            {imagePreviewUri && !imageError ? (
              <Image
                source={{ uri: imagePreviewUri }}
                style={styles.imagePreview}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Feather name="image" size={36} color="#C4BFFA" />
                <Text style={styles.imagePlaceholderText}>
                  {form.imageUrl.trim()
                    ? 'URL inválida ou sem imagem'
                    : 'Prévia da imagem aparece aqui'}
                </Text>
              </View>
            )}
          </View>

          <FormField
            label="URL da Imagem"
            placeholder="https://exemplo.com/imagem.jpg"
            value={form.imageUrl}
            onChangeText={(v) => {
              setImageError(false);
              handleChange('imageUrl', v);
            }}
            keyboardType="url"
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            icon="link"
          />
        </View>

        {/* Kit Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Kit</Text>

          <FormField
            label="Nome do Kit"
            placeholder="Ex: Kit Básico DJ"
            value={form.name}
            onChangeText={(v) => handleChange('name', v)}
            error={errors.name}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            icon="tag"
            required
          />

          <FormField
            ref={descRef}
            label="Descrição"
            placeholder="Descreva o que inclui o kit..."
            value={form.description}
            onChangeText={(v) => handleChange('description', v)}
            error={errors.description}
            multiline
            numberOfLines={4}
            returnKeyType="next"
            icon="align-left"
            required
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField
                ref={priceRef}
                label="Preço/dia (R$)"
                placeholder="0,00"
                value={form.pricePerDay}
                onChangeText={(v) => handleChange('pricePerDay', v)}
                error={errors.pricePerDay}
                keyboardType="decimal-pad"
                returnKeyType="next"
                onSubmitEditing={() => quantityRef.current?.focus()}
                icon="dollar-sign"
                required
              />
            </View>
            <View style={{ width: 16 }} />
            <View style={{ flex: 1 }}>
              <FormField
                ref={quantityRef}
                label="Quantidade"
                placeholder="1"
                value={form.quantity}
                onChangeText={(v) => handleChange('quantity', v)}
                error={errors.quantity}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => imageRef.current?.focus()}
                icon="box"
                required
              />
            </View>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Disponibilidade</Text>
          <View style={styles.toggleCard}>
            <View style={styles.toggleLeft}>
              <View
                style={[
                  styles.toggleIconWrap,
                  {
                    backgroundColor: form.availability
                      ? '#DCFCE7'
                      : '#FEF3C7',
                  },
                ]}
              >
                <Feather
                  name={form.availability ? 'check-circle' : 'tool'}
                  size={20}
                  color={form.availability ? '#16A34A' : '#D97706'}
                />
              </View>
              <View>
                <Text style={styles.toggleLabel}>
                  {form.availability ? 'Disponível' : 'Em manutenção'}
                </Text>
                <Text style={styles.toggleSub}>
                  {form.availability
                    ? 'Kit visível e disponível para locação'
                    : 'Kit indisponível para locação'}
                </Text>
              </View>
            </View>
            <Switch
              value={form.availability}
              onValueChange={(v) => handleChange('availability', v)}
              trackColor={{ false: '#E5E7EB', true: '#A5B4FC' }}
              thumbColor={form.availability ? PRIMARY : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : (
            <>
              <Feather
                name={isEditing ? 'save' : 'plus-circle'}
                size={18}
                color={WHITE}
              />
              <Text style={styles.submitBtnText}>
                {isEditing ? 'Salvar Alterações' : 'Adicionar Kit'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── FormField component ───────────────────────────────────────────────────
interface FormFieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad' | 'url';
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
  autoCapitalize?: 'none' | 'sentences';
  icon?: string;
  required?: boolean;
}

const FormField = React.forwardRef<TextInput, FormFieldProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      error,
      multiline,
      numberOfLines,
      keyboardType,
      returnKeyType,
      onSubmitEditing,
      autoCapitalize,
      icon,
      required,
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={fieldStyles.container}>
        <Text style={fieldStyles.label}>
          {label}
          {required && <Text style={{ color: ERROR }}> *</Text>}
        </Text>
        <View
          style={[
            fieldStyles.inputWrap,
            focused && fieldStyles.inputFocused,
            error ? fieldStyles.inputError : null,
            multiline ? fieldStyles.inputMultiline : null,
          ]}
        >
          {icon && (
            <Feather
              name={icon as any}
              size={16}
              color={focused ? PRIMARY : '#9CA3AF'}
              style={fieldStyles.inputIcon}
            />
          )}
          <TextInput
            ref={ref}
            style={[
              fieldStyles.input,
              multiline && fieldStyles.textArea,
            ]}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            keyboardType={keyboardType ?? 'default'}
            returnKeyType={returnKeyType ?? 'done'}
            onSubmitEditing={onSubmitEditing}
            autoCapitalize={autoCapitalize ?? 'sentences'}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? 'top' : 'center'}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>
        {error && <Text style={fieldStyles.errorText}>{error}</Text>}
      </View>
    );
  }
);

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  inputFocused: { borderColor: BORDER_FOCUS },
  inputError: { borderColor: ERROR },
  inputMultiline: { alignItems: 'flex-start', paddingVertical: 12 },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: TEXT_DARK,
    height: 50,
  },
  textArea: {
    height: 100,
    paddingTop: 0,
  },
  errorText: {
    fontSize: 12,
    color: ERROR,
    marginTop: 4,
    marginLeft: 4,
  },
});

// ─── Main styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
    gap: 12,
  },
  loadingText: { fontSize: 14, color: TEXT_LIGHT },

  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: WHITE,
  },

  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 20 },

  section: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  // Image preview
  imagePreviewWrap: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  imagePreview: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  // Row
  row: { flexDirection: 'row' },

  // Toggle
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: TEXT_DARK },
  toggleSub: { fontSize: 12, color: TEXT_LIGHT, marginTop: 2, maxWidth: 200 },

  // Submit button
  submitBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
});
