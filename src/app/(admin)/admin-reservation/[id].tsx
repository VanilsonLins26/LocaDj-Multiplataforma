import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../../config/firebaseConfig';

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

const STATUS_STEPS = [
  { key: 'PENDENTE', label: 'Reserva Pendente' },
  { key: 'CONFIRMADA', label: 'Reserva Confirmada' },
  { key: 'SAIU_PARA_ENTREGA', label: 'Saiu para entrega' },
  { key: 'EM_ADAMENTO', label: 'Reserva Ativa' },
  { key: 'CONCLUIDA', label: 'Devolvido / Finalizado' }
];

export default function AdminReservationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reservation, setReservation] = useState<any>(null);
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  // Rating Modal States
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingScore, setRatingScore] = useState('');
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    fetchReservationDetails();
  }, [id]);

  const fetchReservationDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado.");

      const idToken = await currentUser.getIdToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };

      const BASE_URL = `https://locadj.onrender.com/api/reservations/${id}`;
      const resp = await fetch(BASE_URL, { headers });

      if (!resp.ok) {
        throw new Error('Reserva não encontrada.');
      }

      const data = await resp.json();
      console.log('ADMIN RESERVATION DATA:', JSON.stringify(data, null, 2));
      setReservation(data);

      // Resolve correct name from Firestore
      if (data.user?.email) {
        try {
          const uQ = query(collection(db, 'users'), where('email', '==', data.user.email.toLowerCase()));
          const uSnap = await getDocs(uQ);
          if (!uSnap.empty) {
            setClientName(uSnap.docs[0].data().name || data.user.name);
          } else {
            setClientName(data.user.name);
          }
        } catch (e) {
          console.warn('Erro ao obter nome do Firestore:', e);
          setClientName(data.user.name);
        }
      } else {
        setClientName(data.user?.name || '');
      }
    } catch (err: any) {
      console.error(err);
      if (!silent) setError('Falha ao carregar a reserva.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateStatus = async (endpoint: string, successMessage: string) => {
    setUpdating(true);
    try {
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : '';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      };

      const resp = await fetch(`https://locadj.onrender.com/api/reservations/${id}/${endpoint}`, {
        method: 'PATCH',
        headers,
      });

      if (!resp.ok) throw new Error('Erro ao atualizar status');

      // Atualização Otimista da UI
      let newStatus = currentStatus;
      if (endpoint === 'left-for-delivery') newStatus = 'SAIU_PARA_ENTREGA';
      else if (endpoint === 'in-progress') newStatus = 'EM_ADAMENTO';
      else if (endpoint === 'completed') newStatus = 'CONCLUIDA';

      setReservation((prev: any) => ({ ...prev, status: newStatus }));

      // Busca os dados atualizados em background sem mostrar o spinner (evita flicker na tela)
      fetchReservationDetails(true);

      if (endpoint === 'completed') {
        // Mostra a tela de avaliação ao concluir
        setRatingModalVisible(true);
      } else {
        Alert.alert('Sucesso', successMessage);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível atualizar o status da reserva.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveRating = async () => {
    if (!reservation || !reservation.user || !reservation.user.email) {
      Alert.alert('Erro', 'Não foi possível identificar o usuário desta reserva.');
      return;
    }

    const scoreNum = parseFloat(ratingScore.replace(',', '.'));
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      Alert.alert('Nota Inválida', 'Por favor, insira uma nota numérica entre 0 e 10.');
      return;
    }

    setSavingRating(true);
    try {
      const userEmail = reservation.user.email.toLowerCase();

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('Aviso', 'Usuário não encontrado no banco de dados. A avaliação não foi salva, mas a reserva foi concluída.');
        setRatingModalVisible(false);
        router.navigate('/(admin)/reservations');
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const newRatings = {
        ...(userData.ratings || {}),
        [reservation.id]: {
          score: scoreNum,
          feedback: ratingFeedback.trim(),
          createdAt: new Date().toISOString()
        }
      };

      const userDocRef = doc(db, 'users', userDoc.id);
      await updateDoc(userDocRef, { ratings: newRatings });

      Alert.alert('Sucesso', 'Reserva finalizada e usuário avaliado!');
      setRatingModalVisible(false);
      setRatingScore('');
      setRatingFeedback('');
      router.navigate('/(admin)/reservations');

    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      Alert.alert('Erro', 'Falha ao salvar a avaliação.');
    } finally {
      setSavingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  if (error || !reservation) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ marginTop: 16, fontSize: 16, textAlign: 'center', color: TEXT_MUTED }}>
          {error || 'Reserva não encontrada.'}
        </Text>
        <TouchableOpacity style={styles.errorBackBtn} onPress={() => router.navigate('/(admin)/reservations')}>
          <Text style={styles.errorBackBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kitName = reservation.kit?.name || 'Kit sem nome';
  const imageUrl = reservation.kit?.imageUrl;
  const pricePerDay = reservation.kit?.pricePerDay ? `R$ ${reservation.kit.pricePerDay.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
  const daily = reservation.daily || 1;
  const totalAmount = reservation.totalAmount ? `R$ ${reservation.totalAmount.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
  const currentStatus = reservation.status || 'PENDENTE';
  const paymentMethod = reservation.paymentMethod || (currentStatus !== 'PENDENTE' ? 'Mercado Pago' : 'A combinar');
  const address = reservation.deliveryAddress || 'Retirada no local / Não informado';

  const formatVisibleDateWithTime = (isoString?: string) => {
    if (!isoString) return '--/--/---- às --:--';
    const str = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const dateObj = new Date(str);
    if (isNaN(dateObj.getTime())) return isoString;
    const brtDate = new Date(dateObj.getTime() - (3 * 60 * 60 * 1000));

    const d = String(brtDate.getUTCDate()).padStart(2, '0');
    const m = String(brtDate.getUTCMonth() + 1).padStart(2, '0');
    const y = brtDate.getUTCFullYear();
    const hs = String(brtDate.getUTCHours()).padStart(2, '0');
    const ms = String(brtDate.getUTCMinutes()).padStart(2, '0');

    return `${d}/${m}/${y} às ${hs}:${ms}`;
  };

  const startDate = formatVisibleDateWithTime(reservation.startDateTime || reservation.startDate);
  const endDate = formatVisibleDateWithTime(reservation.endDateTime || reservation.endDate);

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);
  const activeStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  const getStepColor = (index: number) => {
    if (index < activeStep) return '#10B981'; // Green (Completed)
    if (index === activeStep) return PRIMARY; // Primary (Current)
    return BORDER; // Gray (Future)
  };

  const getStatusDisplay = () => {
    switch (currentStatus) {
      case 'PENDENTE': return { text: 'Reserva Pendente', bg: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', icon: 'clock' };
      case 'CONFIRMADA': return { text: 'Reserva Aprovada', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', icon: 'check-circle' };
      case 'SAIU_PARA_ENTREGA': return { text: 'Saiu para Entrega', bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', icon: 'truck' };
      case 'EM_ADAMENTO':
      case 'IN_PROGRESS': return { text: 'Em Andamento', bg: 'rgba(168, 85, 247, 0.15)', color: '#A855F7', icon: 'play-circle' };
      case 'CONCLUIDA': return { text: 'Concluída', bg: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF', icon: 'check-square' };
      default: return { text: currentStatus, bg: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF', icon: 'info' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.navigate('/(admin)/reservations')}>
          <Ionicons name="arrow-back" size={24} color={TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Reserva</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status Tracker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status do Aluguel</Text>
          <View style={styles.stepperContainer}>
            {STATUS_STEPS.map((step, index) => {
              const isLast = index === STATUS_STEPS.length - 1;
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;
              const color = getStepColor(index);

              const statusLog = (reservation.statusLogs || []).find((log: any) => log.status === step.key);
              const statusDate = statusLog ? formatVisibleDateWithTime(statusLog.date) : null;

              return (
                <View key={step.key} style={styles.stepItem}>
                  <View style={styles.stepIndicatorCol}>
                    <View style={[styles.stepCircle, { borderColor: color, backgroundColor: isCompleted || isActive ? color : '#18181B' }]}>
                      {isCompleted ? (
                        <Feather name="check" size={12} color="#FFF" />
                      ) : isActive ? (
                        <View style={styles.activeDot} />
                      ) : null}
                    </View>
                    {!isLast && <View style={[styles.stepLine, { backgroundColor: isCompleted ? '#10B981' : BORDER }]} />}
                  </View>
                  <View style={styles.stepTextCol}>
                    <Text style={[styles.stepLabel, { color: isActive ? PRIMARY : (isCompleted ? TEXT_LIGHT : TEXT_MUTED) }]}>
                      {step.label}
                    </Text>
                    {statusDate && (
                      <Text style={styles.stepDateLabel}>{statusDate}</Text>
                    )}
                    {isActive && index === 3 && (
                      <Text style={styles.stepSubLabel}>Equipamento em uso pelo cliente</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Kit Reservado */}
        <Text style={styles.sectionTitle}>KIT RESERVADO</Text>
        <View style={styles.card}>
          <View style={styles.kitRow}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.kitImage} />
            ) : (
              <View style={styles.kitImagePlaceholder} />
            )}
            <View style={styles.kitInfo}>
              <Text style={styles.kitName}>{kitName}</Text>
              <Text style={styles.kitDetails}>1x {pricePerDay} / dia</Text>
            </View>
          </View>
        </View>

        {/* Período e Endereço */}
        <Text style={styles.sectionTitle}>PERÍODO E ENDEREÇO</Text>
        <View style={styles.card}>
          <View style={styles.dateRow}>
            <View style={styles.dateIconWrapper}>
              <View style={[styles.dateIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Feather name="clock" size={14} color={PRIMARY} />
              </View>
              <View style={styles.dateDottedLine} />
            </View>
            <View style={styles.dateTextWrapper}>
              <Text style={styles.dateLabel}>Entrega</Text>
              <Text style={styles.dateValue}>{startDate}</Text>
            </View>
          </View>

          <View style={[styles.dateRow, { marginTop: 0 }]}>
            <View style={styles.dateIconWrapper}>
              <View style={[styles.dateIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Feather name="x" size={14} color="#EF4444" />
              </View>
            </View>
            <View style={styles.dateTextWrapper}>
              <Text style={styles.dateLabel}>Devolução (Coleta)</Text>
              <Text style={styles.dateValue}>{endDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.addressLabel}>ENDEREÇO DE ENTREGA</Text>
          <Text style={styles.addressValue}>{address}</Text>
        </View>

        {/* Resumo do Pagamento */}
        <Text style={styles.sectionTitle}>RESUMO DO PAGAMENTO</Text>
        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Valor da Diária</Text>
            <Text style={styles.summaryValue}>{pricePerDay}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dias Locados</Text>
            <Text style={styles.summaryValue}>{daily}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Forma de Pagamento</Text>
            <Text style={styles.summaryValue}>{paymentMethod}</Text>
          </View>

          <View style={styles.dashedDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Pago</Text>
            <Text style={styles.totalValue}>{totalAmount}</Text>
          </View>
        </View>

        {/* Ações do Administrador */}
        {currentStatus !== 'CONCLUIDA' && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>AÇÕES DO ADMINISTRADOR</Text>
            <View style={styles.actionsContainer}>
              {(currentStatus === 'PENDENTE' || currentStatus === 'CONFIRMADA') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnBlue]}
                  onPress={() => updateStatus('left-for-delivery', 'Status atualizado para: Saiu para Entrega')}
                  disabled={updating}
                >
                  <Feather name="truck" size={18} color="#3B82F6" style={styles.actionIcon} />
                  <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Marcar como Saiu p/ Entrega</Text>
                </TouchableOpacity>
              )}

              {currentStatus === 'SAIU_PARA_ENTREGA' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnPurple]}
                  onPress={() => updateStatus('in-progress', 'Status atualizado para: Em Andamento')}
                  disabled={updating}
                >
                  <Feather name="play-circle" size={18} color={PRIMARY} style={styles.actionIcon} />
                  <Text style={[styles.actionBtnText, { color: PRIMARY }]}>Marcar como Em Andamento</Text>
                </TouchableOpacity>
              )}

              {(currentStatus === 'EM_ADAMENTO' || currentStatus === 'IN_PROGRESS') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.btnGreen]}
                  onPress={() => updateStatus('completed', 'Reserva finalizada com sucesso')}
                  disabled={updating}
                >
                  <Feather name="check-square" size={18} color="#10B981" style={styles.actionIcon} />
                  <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Concluir Reserva (Devolvido)</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

      </ScrollView>

      {/* Modal de Avaliação do Cliente */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRatingModalVisible(false);
          router.navigate('/(admin)/reservations');
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '90%' }}
            >
              <View style={[styles.modalContent, { width: '100%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Avaliar Cliente</Text>
                  <TouchableOpacity onPress={() => {
                    setRatingModalVisible(false);
                    router.navigate('/(admin)/reservations'); // Ao fechar sem avaliar, volta pra lista
                  }}>
                    <Ionicons name="close" size={24} color={TEXT_MUTED} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                  <Text style={styles.modalSubtitle}>
                    Como foi a experiência de locação com {clientName || 'este usuário'}?
                  </Text>

                  <Text style={styles.inputLabel}>Nota (0 a 10)</Text>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="Ex: 10"
                    placeholderTextColor={TEXT_MUTED}
                    keyboardType="numeric"
                    value={ratingScore}
                    onChangeText={setRatingScore}
                    maxLength={4}
                  />

                  <Text style={styles.inputLabel}>Feedback (Opcional)</Text>
                  <TextInput
                    style={styles.feedbackInput}
                    placeholder="Ex: Entregou no prazo, equipamento bem cuidado."
                    placeholderTextColor={TEXT_MUTED}
                    multiline
                    textAlignVertical="top"
                    value={ratingFeedback}
                    onChangeText={setRatingFeedback}
                  />

                  <TouchableOpacity
                    style={[styles.saveRatingBtn, (!ratingScore || savingRating) && styles.saveRatingBtnDisabled]}
                    onPress={handleSaveRating}
                    disabled={!ratingScore || savingRating}
                  >
                    {savingRating ? (
                      <ActivityIndicator color={PRIMARY} />
                    ) : (
                      <Text style={[styles.saveRatingBtnText, (!ratingScore || savingRating) && { color: TEXT_MUTED }]}>Salvar Avaliação</Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBackBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: BORDER },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: TEXT_LIGHT },
  scrollContent: { padding: 20, paddingBottom: 40 },

  stepperContainer: { paddingLeft: 4, marginTop: 12 },
  stepItem: { flexDirection: 'row', minHeight: 50 },
  stepIndicatorCol: { alignItems: 'center', width: 24, marginRight: 12 },
  stepCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#18181B', zIndex: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  stepLine: { width: 2, flex: 1, backgroundColor: BORDER, marginTop: -4, marginBottom: -4, zIndex: 1 },
  stepTextCol: { flex: 1, paddingBottom: 24 },
  stepLabel: { fontSize: 14, fontWeight: '600', marginTop: -2 },
  stepDateLabel: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  stepSubLabel: { fontSize: 12, color: PRIMARY, marginTop: 4 },

  sectionTitle: { fontSize: 11, fontWeight: '700', color: TEXT_MUTED, letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: CARD_BG, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: BORDER },

  kitRow: { flexDirection: 'row', alignItems: 'center' },
  kitImage: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  kitImagePlaceholder: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#18181B', marginRight: 12 },
  kitInfo: { flex: 1 },
  kitName: { fontSize: 15, fontWeight: '700', color: TEXT_LIGHT, marginBottom: 4 },
  kitDetails: { fontSize: 13, color: TEXT_MUTED },

  dateRow: { flexDirection: 'row', marginBottom: 16 },
  dateIconWrapper: { width: 24, alignItems: 'center', marginRight: 12 },
  dateIconCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  dateDottedLine: { width: 1, height: 30, borderWidth: 1, borderColor: BORDER, borderStyle: 'dotted', position: 'absolute', top: 24, zIndex: 1 },
  dateTextWrapper: { flex: 1, paddingBottom: 8 },
  dateLabel: { fontSize: 12, color: TEXT_MUTED, marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: '700', color: TEXT_LIGHT },

  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },
  addressLabel: { fontSize: 11, fontWeight: '600', color: TEXT_MUTED, marginBottom: 4 },
  addressValue: { fontSize: 14, fontWeight: '600', color: PRIMARY },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 13, color: TEXT_MUTED },
  summaryValue: { fontSize: 13, fontWeight: '500', color: TEXT_LIGHT },
  dashedDivider: { height: 1, borderWidth: 1, borderColor: BORDER, borderStyle: 'dashed', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: TEXT_LIGHT },
  totalValue: { fontSize: 18, fontWeight: '800', color: PRIMARY },

  actionsContainer: { gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  btnBlue: { backgroundColor: 'transparent', borderColor: '#3B82F6' },
  btnPurple: { backgroundColor: 'transparent', borderColor: PRIMARY },
  btnGreen: { backgroundColor: 'transparent', borderColor: '#10B981' },
  actionIcon: { marginRight: 8 },
  actionBtnText: { color: TEXT_LIGHT, fontSize: 14, fontWeight: '700' },

  errorBackBtn: { marginTop: 24, backgroundColor: 'transparent', borderWidth: 1, borderColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  errorBackBtnText: { color: PRIMARY, fontSize: 16, fontWeight: '600' },

  // Rating Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#18181B', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: BORDER },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: TEXT_LIGHT },
  modalSubtitle: { fontSize: 14, color: TEXT_MUTED, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: TEXT_LIGHT, marginBottom: 8 },
  scoreInput: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 12, height: 48, fontSize: 16, color: TEXT_LIGHT, marginBottom: 16, backgroundColor: '#09090B' },
  feedbackInput: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 12, paddingTop: 12, height: 100, fontSize: 16, color: TEXT_LIGHT, marginBottom: 24, backgroundColor: '#09090B' },
  saveRatingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: PRIMARY, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveRatingBtnDisabled: { borderColor: '#3F3F46' },
  saveRatingBtnText: { color: PRIMARY, fontSize: 15, fontWeight: '700' }
});
