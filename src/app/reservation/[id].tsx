import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';

const PRIMARY = '#5B42F3';
const BG = '#F4F5F7';

const STATUS_STEPS = [
  { key: 'PENDENTE', label: 'Reserva Pendente' },
  { key: 'CONFIRMADA', label: 'Reserva Confirmada' },
  { key: 'SAIU_PARA_ENTREGA', label: 'Saiu para entrega' },
  { key: 'EM_ADAMENTO', label: 'Reserva Ativa' },
  { key: 'CONCLUIDA', label: 'Devolvido / Finalizado' }
];

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReservationDetails();
  }, [id]);

  const fetchReservationDetails = async () => {
    setLoading(true);
    setError('');
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Usuário não autenticado.");
      
      const idToken = await currentUser.getIdToken();
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
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
      setError('Falha ao carregar a reserva.');
    } finally {
      setLoading(false);
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
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatus = reservation.status || 'PENDENTE';
  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);
  const activeStep = currentStepIndex === -1 ? 0 : currentStepIndex;

  const kitName = reservation.kit?.name || reservation.kitName || 'Kit sem nome';
  const imageUrl = reservation.kit?.imageUrl;
  const daily = reservation.daily || 1;
  const price = reservation.totalAmount ? `R$ ${reservation.totalAmount.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
  const paymentMethod = reservation.paymentMethod || 'A combinar';
  const address = reservation.deliveryAddress || 'Retirada no local / Não informado';

  const formatVisibleDateWithTime = (isoString?: string) => {
    if (!isoString) return '--/--/---- - --:--';
    
    // Garante que o JS trate a string como UTC caso o back-end não mande o 'Z'
    const str = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const dateObj = new Date(str);
    
    if (isNaN(dateObj.getTime())) return isoString;
    
    // Converte para Horário de Brasília (UTC-3) forçando o cálculo via getUTC*
    const brtDate = new Date(dateObj.getTime() - (3 * 60 * 60 * 1000));
    
    const d = String(brtDate.getUTCDate()).padStart(2, '0');
    const m = String(brtDate.getUTCMonth() + 1).padStart(2, '0');
    const y = brtDate.getUTCFullYear();
    const hs = String(brtDate.getUTCHours()).padStart(2, '0');
    const ms = String(brtDate.getUTCMinutes()).padStart(2, '0');
    
    return `${d}/${m}/${y} - ${hs}:${ms}`;
  };

  const startDate = formatVisibleDateWithTime(reservation.startDateTime || reservation.startDate);
  const endDate = formatVisibleDateWithTime(reservation.endDateTime || reservation.endDate);

  const getStepColor = (index: number) => {
    if (index < activeStep) return '#10B981'; // Green (Completed)
    if (index === activeStep) return '#5B42F3'; // Primary (Current)
    return '#D1D5DB'; // Gray (Future)
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <TouchableOpacity style={styles.headerBackBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reserva #{id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Tracker */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Status do Aluguel</Text>
          <View style={styles.stepperContainer}>
            {STATUS_STEPS.map((step, index) => {
              const isLast = index === STATUS_STEPS.length - 1;
              const isCompleted = index < activeStep;
              const isActive = index === activeStep;
              const color = getStepColor(index);
              
              const statusLog = (reservation.statusLogs || []).find((log: any) => log.status === step.key);
              const statusDate = statusLog ? formatVisibleDateWithTime(statusLog.date).replace(' - ', ' às ') : null;

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

        <Text style={styles.sectionSubHeading}>ITEM RESERVADO</Text>

        {/* Kit Info */}
        <View style={styles.sectionCard}>
          <View style={styles.kitRow}>
            <View style={styles.kitImageContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.kitImage} />
              ) : (
                <View style={styles.kitPlaceholder} />
              )}
            </View>
            <View style={styles.kitInfoCol}>
              <Text style={styles.kitTitle}>{kitName}</Text>
              <Text style={styles.kitDaily}>{daily} Diárias</Text>
              <Text style={styles.kitPrice}>{price}</Text>
            </View>
          </View>
        </View>

        {/* Detail Info */}
        <View style={styles.sectionCard}>
          <View style={styles.datesRow}>
            <View style={styles.dateInfoCol}>
              <Text style={styles.infoLabel}>DATA DE INÍCIO</Text>
              <Text style={styles.infoValue}>{startDate}</Text>
            </View>
            <View style={styles.dateInfoCol}>
              <Text style={styles.infoLabel}>DATA DE TÉRMINO</Text>
              <Text style={styles.infoValue}>{endDate}</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>FORMA DE PAGAMENTO</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.infoValue}>{paymentMethod}</Text>
              {paymentMethod.toLowerCase().includes('pix') && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 4 }} />
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>ENDEREÇO DE ENTREGA</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{address}</Text>
          </View>
        </View>

      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  headerBackBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  sectionSubHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 10,
    marginLeft: 4,
  },
  stepperContainer: {
    paddingLeft: 4,
  },
  stepItem: {
    flexDirection: 'row',
    minHeight: 50,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 12,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    zIndex: 2,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginTop: -4,
    marginBottom: -4,
    zIndex: 1,
  },
  stepTextCol: {
    flex: 1,
    paddingBottom: 24,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: -2,
  },
  stepDateLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  stepSubLabel: {
    fontSize: 12,
    color: '#5B42F3',
    marginTop: 4,
  },
  kitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kitImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  kitImage: {
    width: '100%',
    height: '100%',
  },
  kitPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D1D5DB',
  },
  kitInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  kitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  kitDaily: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  kitPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#5B42F3',
    alignSelf: 'flex-end',
    marginTop: -24,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInfoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  infoBlock: {
    marginBottom: 4,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginTop: 24,
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
