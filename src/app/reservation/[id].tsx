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
import * as Linking from 'expo-linking';
import { auth } from '../../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);

  const handlePayNow = async () => {
    setLoadingPay(true);
    try {
      await AsyncStorage.setItem('latest_checkout_reservation_id', String(id));
      const currentUser = auth.currentUser;
      const token = await currentUser?.getIdToken();

      const cleanUrl = (url: string) => {
        if (url.includes(':///')) {
          return url.replace(':///', '://localhost/');
        }
        return url;
      };

      const successUrl = cleanUrl(Linking.createURL('/payment/approved'));
      const failureUrl = cleanUrl(Linking.createURL('/payment/failed'));
      const pendingUrl = cleanUrl(Linking.createURL('/payment/pending'));

      const checkoutResp = await fetch('https://locadj.onrender.com/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          reservationId: Number(id),
          successUrl: successUrl,
          failureUrl: failureUrl,
          pendingUrl: pendingUrl
        })
      });

      if (checkoutResp.ok) {
        const checkoutData = await checkoutResp.text();
        try {
          const jsonData = JSON.parse(checkoutData);
          if (jsonData?.redirectUrl) {
            Linking.openURL(jsonData.redirectUrl);
            return;
          } else if (jsonData?.sandbox_init_point || jsonData?.init_point) {
            Linking.openURL(jsonData.sandbox_init_point || jsonData.init_point);
            return;
          } else if (jsonData?.url) {
            Linking.openURL(jsonData.url);
            return;
          }
        } catch {
          if (checkoutData.startsWith('http')) {
            Linking.openURL(checkoutData);
            return;
          }
        }
        Alert.alert('Erro', 'Não foi possível obter o link de pagamento do Mercado Pago.');
      } else {
        Alert.alert('Erro', 'O backend do Checkout retornou erro.');
      }
    } catch (e) {
      console.warn(e);
      Alert.alert('Erro', 'Verifique sua conexão.');
    } finally {
      setLoadingPay(false);
    }
  };

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
      console.log('RESERVATION DATA:', JSON.stringify(data, null, 2));
      setReservation(data);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao carregar a reserva.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    Alert.alert(
      'Cancelar Reserva',
      'Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.',
      [
        { text: 'Não, manter', style: 'cancel' },
        {
          text: 'Sim, cancelar',
          style: 'destructive',
          onPress: async () => {
            setCanceling(true);
            try {
               const currentUser = auth.currentUser;
               if (!currentUser) throw new Error("Usuário não autenticado.");
               
               const idToken = await currentUser.getIdToken();
               const headers = { 
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${idToken}`
               };

               const BASE_URL = `https://locadj.onrender.com/api/reservations/${id}/cancel`;
               const resp = await fetch(BASE_URL, {
                 method: 'PATCH',
                 headers
               });

               if (!resp.ok) {
                 throw new Error('Falha ao cancelar a reserva.');
               }

               Alert.alert('Sucesso', 'Sua reserva foi cancelada com sucesso.');
               fetchReservationDetails();
            } catch (err: any) {
               console.error(err);
               Alert.alert('Erro', err.message || 'Não foi possível cancelar a reserva no momento.');
            } finally {
               setCanceling(false);
            }
          }
        }
      ]
    );
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
  const paymentMethod = reservation.paymentMethod || (currentStatus !== 'PENDENTE' ? 'Mercado Pago' : 'A combinar');
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
    if (index === activeStep) return PRIMARY; // Primary (Current)
    return BORDER; // Gray (Future)
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
        
        {/* Status Tracker or Cancellation Card */}
        {currentStatus === 'CANCELADA' ? (
          <View style={[styles.sectionCard, styles.cancelCard]}>
            <View style={styles.cancelHeaderRow}>
              <View style={styles.cancelIconContainer}>
                <Ionicons name="close-circle" size={28} color="#EF4444" />
              </View>
              <View style={styles.cancelTextCol}>
                <Text style={styles.cancelTitle}>Reserva Cancelada</Text>
                {(() => {
                  const cancellationLog = (reservation.statusLogs || []).find((log: any) => log.status === 'CANCELADA');
                  const cancellationDate = cancellationLog ? formatVisibleDateWithTime(cancellationLog.date).replace(' - ', ' às ') : null;
                  return cancellationDate ? (
                    <Text style={styles.cancelSubtitle}>Cancelada em {cancellationDate}</Text>
                  ) : (
                    <Text style={styles.cancelSubtitle}>Esta reserva foi cancelada.</Text>
                  );
                })()}
              </View>
            </View>
            <Text style={styles.cancelInfoText}>
              Esta reserva foi cancelada e o equipamento não sairá para entrega. Se você já realizou algum pagamento, entre em contato com o nosso suporte para tratar do estorno ou renegociação.
            </Text>
          </View>
        ) : (
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
                      <View style={[styles.stepCircle, { borderColor: color, backgroundColor: isCompleted || isActive ? color : CARD_BG }]}>
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
        )}

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

        {/* Pay Now Button */}
        {currentStatus === 'PENDENTE' && (
          <TouchableOpacity
            style={[styles.payNowBtn, loadingPay && styles.payNowBtnDisabled]}
            onPress={handlePayNow}
            disabled={loadingPay}
            activeOpacity={0.8}
          >
            {loadingPay ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.payNowBtnText}>Pagar Agora com Mercado Pago</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Cancel Reservation Button */}
        {(currentStatus === 'PENDENTE' || currentStatus === 'CONFIRMADA') && (
          <TouchableOpacity
            style={[styles.cancelBtn, canceling && styles.cancelBtnDisabled]}
            onPress={handleCancelReservation}
            disabled={canceling}
            activeOpacity={0.8}
          >
            {canceling ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.cancelBtnText}>Cancelar Reserva</Text>
              </>
            )}
          </TouchableOpacity>
        )}

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
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerBackBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 20,
  },
  sectionSubHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: TEXT_MUTED,
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
    backgroundColor: CARD_BG,
    zIndex: 2,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: TEXT_LIGHT,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: BORDER,
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
    color: TEXT_MUTED,
    marginTop: 2,
  },
  stepSubLabel: {
    fontSize: 12,
    color: PRIMARY,
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
    backgroundColor: BORDER,
    marginRight: 16,
  },
  kitImage: {
    width: '100%',
    height: '100%',
  },
  kitPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: BORDER,
  },
  kitInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  kitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  kitDaily: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  kitPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: PRIMARY,
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
    color: TEXT_MUTED,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_LIGHT,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backBtnText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelBtnDisabled: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  cancelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cancelIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cancelTextCol: {
    flex: 1,
  },
  cancelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  cancelSubtitle: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  cancelInfoText: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  payNowBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  payNowBtnDisabled: {
    borderColor: '#3F3F46',
  },
  payNowBtnText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '700',
  },
});
