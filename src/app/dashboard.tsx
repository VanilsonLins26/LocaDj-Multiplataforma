import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ─── Tela em construção ───────────────────────────────────────
// TODO: implementar dashboard admin completo (issue #10)
// ─────────────────────────────────────────────────────────────

const PRIMARY = '#5245F1';
const GRAY_500 = '#6B7280';
const DARK_BG = '#040417';

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="construct-outline" size={40} color={PRIMARY} />
        </View>
        <Text style={styles.title}>Dashboard Admin</Text>
        <Text style={styles.sub}>Tela em construção.{'\n'}Em breve disponível.</Text>

        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.btnText}>Voltar ao início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: DARK_BG },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap:  { width: 88, height: 88, borderRadius: 24, backgroundColor: 'rgba(82,69,241,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title:     { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 10 },
  sub:       { fontSize: 15, color: GRAY_500, textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  btn:       { flexDirection: 'row', alignItems: 'center', backgroundColor: PRIMARY, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  btnText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
});