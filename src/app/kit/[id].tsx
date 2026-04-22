import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';

const PRIMARY = '#5B4EE4';
const GRAY_100 = '#F3F4F6';
const GRAY_200 = '#E5E7EB';
const GRAY_500 = '#6B7280';
const GRAY_900 = '#111827';

interface Kit {
  id: number;
  name: string;
  description: string;
  pricePerDay: number;
  imageUrl?: string;
  quantity: number;
  rents: number;
  availability?: boolean;
  available?: boolean;
}

export default function KitDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [startDate, setStartDate] = useState(new Date());

  const initialEndDate = new Date();
  initialEndDate.setDate(initialEndDate.getDate() + 1);
  const [endDate, setEndDate] = useState(initialEndDate);

  const [showPicker, setShowPicker] = useState<'none' | 'start' | 'end'>('none');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (id) {
        fetchKitDetails();
      }
    });
    return unsubscribe;
  }, [id]);

  const fetchKitDetails = async () => {
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const resp = await fetch(`https://locadj.onrender.com/api/kits/${id}`, { headers });
      if (!resp.ok) throw new Error('Falha ao buscar kit');
      const data = await resp.json();
      setKit(data);
    } catch (err) {
      setError('Erro ao carregar detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const formatVisibleDate = (d: Date) => {
    const day = d.getDate().toString().padStart(2, '0');
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${mo}/${d.getFullYear()}`;
  };

  const formatCurrency = (val: number) => {
    return `R$ ${val.toFixed(2).replace('.', ',')}`;
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker('none');
      if (event.type === 'dismissed') return;
    }

    if (selectedDate) {
      if (showPicker === 'start') {
        setStartDate(selectedDate);
        if (endDate <= selectedDate) {
          const newEnd = new Date(selectedDate);
          newEnd.setDate(newEnd.getDate() + 1);
          setEndDate(newEnd);
        }
      } else if (showPicker === 'end') {
        setEndDate(selectedDate);
        if (startDate >= selectedDate) {
          const newStart = new Date(selectedDate);
          newStart.setDate(newStart.getDate() - 1);
          setStartDate(newStart);
        }
      }
    }
  };

  const startObj = new Date(startDate);
  startObj.setHours(0, 0, 0, 0);
  const endObj = new Date(endDate);
  endObj.setHours(0, 0, 0, 0);

  let diffTime = endObj.getTime() - startObj.getTime();
  let durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (durationDays < 1) durationDays = 1;

  const finalTotal = kit ? kit.pricePerDay * durationDays : 0;

  const formatISODateTime = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  };

  const handleConfirm = () => {
    if (!kit) return;

    router.push({
      pathname: '/checkout',
      params: {
        kitId: String(kit.id),
        kitName: kit.name,
        kitPrice: String(kit.pricePerDay),
        kitImageUrl: kit.imageUrl || '',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        total: finalTotal.toString(),
        days: durationDays.toString(),
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (error || !kit) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <Text style={styles.errorText}>{error || 'Kit não encontrado.'}</Text>
        <TouchableOpacity style={styles.btnRetry} onPress={() => router.back()}>
          <Text style={styles.btnRetryText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: PRIMARY }}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} translucent />
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrapper} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Kit</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.imageSection}>
            {kit.imageUrl ? (
              <Image source={{ uri: kit.imageUrl }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={{ color: GRAY_500, fontSize: 13 }}>Foto</Text>
              </View>
            )}

            <View style={styles.priceBadge}>
              <Text style={styles.priceBadgeText}>{formatCurrency(kit.pricePerDay)}/dia</Text>
            </View>
          </View>

          <Text style={styles.kitTitle}>{kit.name}</Text>

          <Text style={styles.dateLabel}>Selecione as datas</Text>

          <View style={styles.datesRow}>
            <TouchableOpacity style={styles.dateBox} activeOpacity={0.8} onPress={() => setShowPicker('start')}>
              <Text style={styles.dateType}>Início</Text>
              <Text style={styles.dateValue}>{formatVisibleDate(startDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateBox} activeOpacity={0.8} onPress={() => setShowPicker('end')}>
              <Text style={styles.dateType}>Término</Text>
              <Text style={styles.dateValue}>{formatVisibleDate(endDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View>
            <Text style={styles.footerTotalLabel}>Total ({durationDays} dia{durationDays > 1 ? 's' : ''})</Text>
            <Text style={styles.footerTotalValue}>{formatCurrency(finalTotal)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.btnConfirm, submitting && { opacity: 0.7 }]}
            activeOpacity={0.85}
            onPress={handleConfirm}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.btnConfirmText}>Confirmar</Text>
            )}
          </TouchableOpacity>
        </View>

        {showPicker !== 'none' && (
          Platform.OS === 'ios' ? (
            <Modal transparent animationType="slide" visible={true}>
              <View style={styles.modalBg}>
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerHeader}>
                    <TouchableOpacity onPress={() => setShowPicker('none')}>
                      <Text style={styles.pickerDoneText}>Concluído</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={showPicker === 'start' ? startDate : endDate}
                    mode="date"
                    display="spinner"
                    minimumDate={showPicker === 'end' ? startDate : new Date()}
                    onChange={onDateChange}
                    textColor="#000"
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={showPicker === 'start' ? startDate : endDate}
              mode="date"
              display="default"
              minimumDate={showPicker === 'end' ? startDate : new Date()}
              onChange={onDateChange}
            />
          )
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  header: { backgroundColor: PRIMARY, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backBtnWrapper: { width: 24 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  errorText: { fontSize: 15, color: GRAY_500, marginBottom: 16 },
  btnRetryText: { color: PRIMARY, fontWeight: '600' },
  btnRetry: { padding: 10 },
  content: { padding: 24, flex: 1, backgroundColor: '#FFF' },
  imageSection: { width: '100%', height: 220, backgroundColor: '#F7F8FA', borderRadius: 20, overflow: 'hidden', marginBottom: 24 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  priceBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: PRIMARY, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  priceBadgeText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  kitTitle: { fontSize: 22, fontWeight: '800', color: GRAY_900, marginBottom: 36 },
  dateLabel: { fontSize: 14, fontWeight: '700', color: GRAY_900, marginBottom: 12 },
  datesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  dateBox: { flex: 1, borderWidth: 1, borderColor: GRAY_200, borderRadius: 16, padding: 16, backgroundColor: '#FFF' },
  dateType: { fontSize: 12, color: GRAY_500, marginBottom: 6 },
  dateValue: { fontSize: 15, fontWeight: '700', color: GRAY_900 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: GRAY_200, backgroundColor: '#FFFFFF' },
  footerTotalLabel: { fontSize: 12, color: GRAY_500, marginBottom: 4 },
  footerTotalValue: { fontSize: 24, fontWeight: '800', color: GRAY_900 },
  btnConfirm: { backgroundColor: PRIMARY, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  btnConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  modalBg: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  pickerContainer: { backgroundColor: '#fff', paddingBottom: 24 },
  pickerHeader: { alignItems: 'flex-end', padding: 16, backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  pickerDoneText: { color: PRIMARY, fontWeight: 'bold', fontSize: 16 }
});
