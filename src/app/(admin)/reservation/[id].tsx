import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../../config/firebaseConfig';

const PRIMARY = '#5B4EE4';
const BG = '#F4F5F8';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#111827';
const TEXT_GRAY = '#6B7280';

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
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

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
      setReservation(data);
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

      Alert.alert('Sucesso', successMessage);

      // Atualização Otimista da UI
      let newStatus = currentStatus;
      if (endpoint === 'left-for-delivery') newStatus = 'SAIU_PARA_ENTREGA';
      else if (endpoint === 'in-progress') newStatus = 'EM_ADAMENTO';
      else if (endpoint === 'completed') newStatus = 'CONCLUIDA';

      setReservation((prev: any) => ({ ...prev, status: newStatus }));

      // Busca os dados atualizados em background sem mostrar o spinner (evita flicker na tela)
      fetchReservationDetails(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível atualizar o status da reserva.');
    } finally {
      setUpdating(false);
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
        <Text style={{ marginTop: 16, fontSize: 16, textAlign: 'center', color: '#4B5563' }}>
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
  const paymentMethod = reservation.paymentMethod || 'A combinar';
  const address = reservation.deliveryAddress || 'Retirada no local / Não informado';
  const currentStatus = reservation.status || 'PENDENTE';

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
    if (index === activeStep) return '#5B42F3'; // Primary (Current)
    return '#D1D5DB'; // Gray (Future)
  };

  const getStatusDisplay = () => {
    switch(currentStatus) {
      case 'PENDENTE': return { text: 'Reserva Pendente', bg: '#FEF3C7', color: '#D97706', icon: 'clock' };
      case 'CONFIRMADA': return { text: 'Reserva Aprovada', bg: '#DCFCE7', color: '#16A34A', icon: 'check-circle' };
      case 'SAIU_PARA_ENTREGA': return { text: 'Saiu para Entrega', bg: '#DBEAFE', color: '#2563EB', icon: 'truck' };
      case 'EM_ADAMENTO': 
      case 'IN_PROGRESS': return { text: 'Em Andamento', bg: '#F3E8FF', color: '#9333EA', icon: 'play-circle' };
      case 'CONCLUIDA': return { text: 'Concluída', bg: '#F3F4F6', color: '#4B5563', icon: 'check-square' };
      default: return { text: currentStatus, bg: '#F3F4F6', color: '#4B5563', icon: 'info' };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.navigate('/(admin)/reservations')}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
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
                    <View style={[styles.stepCircle, { borderColor: color, backgroundColor: isCompleted || isActive ? color : '#FFF' }]}>
                      {isCompleted ? (
                        <Feather name="check" size={12} color="#FFF" />
                      ) : isActive ? (
                        <View style={styles.activeDot} />
                      ) : null}
                    </View>
                    {!isLast && <View style={[styles.stepLine, { backgroundColor: isCompleted ? '#10B981' : '#E5E7EB' }]} />}
                  </View>
                  <View style={styles.stepTextCol}>
                    <Text style={[styles.stepLabel, { color: isActive ? '#5B42F3' : (isCompleted ? '#111827' : '#9CA3AF') }]}>
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
              <View style={[styles.dateIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Feather name="clock" size={14} color="#5B4EE4" />
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
              <View style={[styles.dateIconCircle, { backgroundColor: '#FEE2E2' }]}>
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
                  <Feather name="truck" size={18} color="#FFF" style={styles.actionIcon} />
                  <Text style={styles.actionBtnText}>Marcar como Saiu p/ Entrega</Text>
                </TouchableOpacity>
              )}

              {currentStatus === 'SAIU_PARA_ENTREGA' && (
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.btnPurple]}
                  onPress={() => updateStatus('in-progress', 'Status atualizado para: Em Andamento')}
                  disabled={updating}
                >
                  <Feather name="play-circle" size={18} color="#FFF" style={styles.actionIcon} />
                  <Text style={styles.actionBtnText}>Marcar como Em Andamento</Text>
                </TouchableOpacity>
              )}

              {(currentStatus === 'EM_ADAMENTO' || currentStatus === 'IN_PROGRESS') && (
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.btnGreen]}
                  onPress={() => updateStatus('completed', 'Reserva finalizada com sucesso')}
                  disabled={updating}
                >
                  <Feather name="check-square" size={18} color="#FFF" style={styles.actionIcon} />
                  <Text style={styles.actionBtnText}>Concluir Reserva (Devolvido)</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerBackBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', color: WHITE },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  stepperContainer: { paddingLeft: 4, marginTop: 12 },
  stepItem: { flexDirection: 'row', minHeight: 50 },
  stepIndicatorCol: { alignItems: 'center', width: 24, marginRight: 12 },
  stepCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', zIndex: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  stepLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: -4, marginBottom: -4, zIndex: 1 },
  stepTextCol: { flex: 1, paddingBottom: 24 },
  stepLabel: { fontSize: 14, fontWeight: '600', marginTop: -2 },
  stepDateLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  stepSubLabel: { fontSize: 12, color: '#5B42F3', marginTop: 4 },
  
  sectionTitle: { fontSize: 11, fontWeight: '700', color: TEXT_GRAY, letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  
  kitRow: { flexDirection: 'row', alignItems: 'center' },
  kitImage: { width: 48, height: 48, borderRadius: 10, marginRight: 12 },
  kitImagePlaceholder: { width: 48, height: 48, borderRadius: 10, backgroundColor: '#F3F4F6', marginRight: 12 },
  kitInfo: { flex: 1 },
  kitName: { fontSize: 15, fontWeight: '700', color: TEXT_DARK, marginBottom: 4 },
  kitDetails: { fontSize: 13, color: TEXT_GRAY },
  
  dateRow: { flexDirection: 'row', marginBottom: 16 },
  dateIconWrapper: { width: 24, alignItems: 'center', marginRight: 12 },
  dateIconCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  dateDottedLine: { width: 1, height: 30, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dotted', position: 'absolute', top: 24, zIndex: 1 },
  dateTextWrapper: { flex: 1, paddingBottom: 8 },
  dateLabel: { fontSize: 12, color: TEXT_GRAY, marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  addressLabel: { fontSize: 11, fontWeight: '600', color: TEXT_GRAY, marginBottom: 4 },
  addressValue: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 13, color: TEXT_GRAY },
  summaryValue: { fontSize: 13, fontWeight: '500', color: TEXT_DARK },
  dashedDivider: { height: 1, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed', marginVertical: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  totalValue: { fontSize: 18, fontWeight: '800', color: PRIMARY },
  
  actionsContainer: { gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12 },
  btnBlue: { backgroundColor: '#3B82F6' },
  btnPurple: { backgroundColor: '#8B5CF6' },
  btnGreen: { backgroundColor: '#10B981' },
  actionIcon: { marginRight: 8 },
  actionBtnText: { color: WHITE, fontSize: 14, fontWeight: '700' },

  errorBackBtn: { marginTop: 24, backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  errorBackBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' }
});
