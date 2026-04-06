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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function NovoEnderecoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidadeEstado, setCidadeEstado] = useState('');
  const [salvarComo, setSalvarComo] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Endereço</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* CEP */}
          <InputGroup label="CEP">
            <TextInput
              style={styles.input}
              placeholder="00000-000"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={cep}
              onChangeText={(v) => setCep(formatCep(v))}
              maxLength={9}
            />
          </InputGroup>

          {/* Rua / Avenida */}
          <InputGroup label="Rua / Avenida">
            <TextInput
              style={styles.input}
              placeholder="Ex: Rua das Flores"
              placeholderTextColor="#9CA3AF"
              value={rua}
              onChangeText={setRua}
            />
          </InputGroup>

          {/* Número + Complemento side by side */}
          <View style={styles.row}>
            <View style={[styles.inputGroupRow, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Número</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 123"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={numero}
                  onChangeText={setNumero}
                />
              </View>
            </View>
            <View style={[styles.inputGroupRow, { flex: 2 }]}>
              <Text style={styles.label}>Complemento</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Apto, Bloco (Opcional)"
                  placeholderTextColor="#9CA3AF"
                  value={complemento}
                  onChangeText={setComplemento}
                />
              </View>
            </View>
          </View>

          {/* Bairro */}
          <InputGroup label="Bairro">
            <TextInput
              style={styles.input}
              placeholder="Ex: Aldeota"
              placeholderTextColor="#9CA3AF"
              value={bairro}
              onChangeText={setBairro}
            />
          </InputGroup>

          {/* Cidade / Estado */}
          <InputGroup label="Cidade / Estado">
            <TextInput
              style={styles.input}
              placeholder="Ex: Fortaleza - CE"
              placeholderTextColor="#9CA3AF"
              value={cidadeEstado}
              onChangeText={setCidadeEstado}
            />
          </InputGroup>

          {/* Divider */}
          <View style={styles.sectionDivider} />

          {/* Salvar como */}
          <InputGroup label="Salvar como">
            <TextInput
              style={styles.input}
              placeholder="Ex: Casa, Trabalho, Sítio"
              placeholderTextColor="#9CA3AF"
              value={salvarComo}
              onChangeText={setSalvarComo}
            />
          </InputGroup>

          {/* Toggle: Endereço principal */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Tornar este meu endereço principal</Text>
              <Text style={styles.toggleSubtitle}>
                Este será o endereço padrão em suas reservas
              </Text>
            </View>
            <Switch
              value={isPrimary}
              onValueChange={setIsPrimary}
              trackColor={{ false: '#E5E7EB', true: '#C7C2FC' }}
              thumbColor={isPrimary ? '#5245F1' : '#FFF'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </ScrollView>

        {/* Footer Button */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Salvar Endereço</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// --- Helper sub-component ---

function InputGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>{children}</View>
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
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputGroupRow: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: '#1F2937',
    height: '100%',
  },

  // Divider
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 20,
  },

  // Toggle card
  toggleCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
