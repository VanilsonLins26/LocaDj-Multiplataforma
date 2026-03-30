import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../config/firebaseConfig';

export default function PerfilScreen() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error('Erro ao sair da conta:', error);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Meu Perfil</Text>
        <Text style={styles.subtitle}>Em breve disponível.</Text>
        
        <TouchableOpacity
          style={styles.btnLogout}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnText}>Sair da conta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#040417' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#9CA3AF', marginTop: 8, marginBottom: 32 },
  btnLogout: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
