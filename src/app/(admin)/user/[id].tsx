import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../config/firebaseConfig';

const PRIMARY = '#5B4EE4';
const GRAY_100 = '#F3F4F6';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_900 = '#111827';
const BG = '#F4F5F7';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  cpf?: string;
  createdAt: any;
  ratings?: Record<string, { score: number; feedback: string; createdAt: string }>;
}

export default function AdminUserDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Rating States
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [ratingScore, setRatingScore] = useState('');
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [savingRating, setSavingRating] = useState(false);

  const handleSaveRating = async () => {
    if (!selectedReservation || !user) return;
    const scoreNum = parseFloat(ratingScore.replace(',', '.'));
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 10) {
      Alert.alert('Nota Inválida', 'Por favor, insira uma nota numérica entre 0 e 10.');
      return;
    }
    
    setSavingRating(true);
    try {
      const userRef = doc(db, 'users', user.id);
      const newRatings = {
        ...(user.ratings || {}),
        [selectedReservation.id]: {
          score: scoreNum,
          feedback: ratingFeedback.trim(),
          createdAt: new Date().toISOString()
        }
      };
      
      await updateDoc(userRef, { ratings: newRatings });
      setUser({ ...user, ratings: newRatings });
      
      setRatingModalVisible(false);
      setRatingScore('');
      setRatingFeedback('');
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível salvar a avaliação.');
    } finally {
      setSavingRating(false);
    }
  };

  const fetchUserDetailsAndReservations = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch User Details from Firebase
      const userDocRef = doc(db, 'users', id as string);
      const userSnapshot = await getDoc(userDocRef);
      
      let fetchedUser = null;
      if (userSnapshot.exists()) {
        fetchedUser = { id: userSnapshot.id, ...userSnapshot.data() } as User;
        setUser(fetchedUser);
      } else {
        setLoading(false);
        return;
      }

      // Fetch Reservations
      const currentUser = auth.currentUser;
      if (currentUser && fetchedUser.email) {
        const idToken = await currentUser.getIdToken();
        const headers: Record<string, string> = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        };

        const BASE_URL = 'https://locadj.onrender.com/api/reservations';
        const listResp = await fetch(BASE_URL, { headers });
        let allData: any[] = [];
        
        if (listResp.ok) {
          const json = await listResp.json();
          allData = Array.isArray(json) ? json : (json.value ?? []);
        }

        const finalData = allData
          .filter((item, index, self) => 
            item != null && 
            item.user?.email?.toLowerCase() === fetchedUser.email.toLowerCase() &&
            self.findIndex(t => t.id === item.id) === index
          )
          .sort((a, b) => b.id - a.id);

        setReservations(finalData);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do usuário:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserDetailsAndReservations();
  }, [fetchUserDetailsAndReservations]);

  const renderBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDENTE') {
      return (
        <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.badgeText, { color: '#B45309' }]}>Pendente</Text>
        </View>
      );
    }
    if (s === 'CONFIRMADA' || s === 'CONCLUIDA') {
      return (
        <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.badgeText, { color: '#065F46' }]}>
            {s === 'CONCLUIDA' ? 'Concluída' : 'Confirmada'}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
        <Text style={[styles.badgeText, { color: '#1D4ED8' }]}>{s.replace('_', ' ')}</Text>
      </View>
    );
  };

  const formatVisibleDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    const str = isoString.endsWith('Z') ? isoString : `${isoString}Z`;
    const dateObj = new Date(str);
    if (isNaN(dateObj.getTime())) return isoString;
    const brtDate = new Date(dateObj.getTime() - (3 * 60 * 60 * 1000));
    const d = String(brtDate.getUTCDate()).padStart(2, '0');
    const m = String(brtDate.getUTCMonth() + 1).padStart(2, '0');
    const y = brtDate.getUTCFullYear();
    return `${d}/${m}/${y}`;
  };

  const formatDateString = (dateObj: any) => {
    if (!dateObj) return '';
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>Usuário não encontrado.</Text>
        <TouchableOpacity style={styles.backButtonCenter} onPress={() => router.back()}>
          <Text style={styles.backButtonTextCenter}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={GRAY_900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Usuário</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Informações do Usuário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarTextLarge}>
                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={[styles.roleBadge, user.role === 'admin' ? styles.roleAdmin : styles.roleUser, { alignSelf: 'center', marginBottom: 16 }]}>
              <Text style={[styles.roleText, user.role === 'admin' ? styles.roleTextAdmin : styles.roleTextUser]}>
                {user.role === 'admin' ? 'Admin' : 'Usuário'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={GRAY_500} />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={GRAY_500} />
              <Text style={styles.infoText}>{user.phone || 'Sem telefone cadastrado'}</Text>
            </View>
            {user.cpf && (
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={20} color={GRAY_500} />
                <Text style={styles.infoText}>CPF: {user.cpf}</Text>
              </View>
            )}
            {user.createdAt && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={GRAY_500} />
                <Text style={styles.infoText}>Cadastrado em: {formatDateString(user.createdAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Locações do Usuário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Locações ({reservations.length})</Text>
          
          {reservations.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Ionicons name="calendar-clear-outline" size={48} color={GRAY_300} />
               <Text style={styles.emptyText}>Nenhuma locação encontrada.</Text>
             </View>
          ) : (
            reservations.map((item) => {
              const kitName = item.kit?.name || item.kitName || 'Kit sem nome';
              const startDate = item.startDateTime ? formatVisibleDate(item.startDateTime) : (item.startDate || '--/--/----');
              const endDate = item.endDateTime ? formatVisibleDate(item.endDateTime) : (item.endDate || '--/--/----');
              const price = item.totalAmount ? `R$ ${item.totalAmount.toFixed(2).replace('.', ',')}` : 'R$ 0,00';
              const daily = item.daily || 1;
              const imageUrl = item.kit?.imageUrl;
              const existingRating = user?.ratings?.[item.id];

              return (
                <View key={item.id} style={styles.reservationCard}>
                  <View style={styles.reservationMainContent}>
                    <View style={styles.imageContainer}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.reservationDetails}>
                    <View style={styles.reservationHeader}>
                      <Text style={styles.kitName} numberOfLines={1}>{kitName}</Text>
                      {renderBadge(item.status || 'PENDENTE')}
                    </View>
                    <View style={styles.datesBox}>
                      <View style={styles.dateCol}>
                        <Text style={styles.dateLabel}>INÍCIO</Text>
                        <Text style={styles.dateValue}>{startDate}</Text>
                      </View>
                      <Feather name="arrow-right" size={14} color="#9CA3AF" />
                      <View style={styles.dateCol}>
                        <Text style={styles.dateLabel}>FIM</Text>
                        <Text style={styles.dateValue}>{endDate}</Text>
                      </View>
                    </View>
                    <View style={styles.reservationFooter}>
                      <Text style={styles.durationText}>{daily} {daily > 1 ? 'dias' : 'dia'}</Text>
                      <Text style={styles.priceText}>{price}</Text>
                    </View>
                  </View>
                  </View>

                  {/* Rating Section */}
                  <View style={styles.ratingSection}>
                    {existingRating ? (
                      <View style={styles.existingRatingBox}>
                        <View style={styles.ratingHeaderBox}>
                          <Ionicons name="star" size={16} color="#F59E0B" />
                          <Text style={styles.ratingScoreText}>Nota: {existingRating.score}/10</Text>
                        </View>
                        {existingRating.feedback ? (
                          <Text style={styles.ratingFeedbackText}>Feedback: {existingRating.feedback}</Text>
                        ) : null}
                      </View>
                    ) : (
                      <TouchableOpacity 
                        style={styles.rateButton}
                        onPress={() => {
                          setSelectedReservation(item);
                          setRatingScore('');
                          setRatingFeedback('');
                          setRatingModalVisible(true);
                        }}
                      >
                        <Ionicons name="star-outline" size={16} color={PRIMARY} />
                        <Text style={styles.rateButtonText}>Avaliar Locação</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal de Avaliação */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliar Aluguel</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <Ionicons name="close" size={24} color={GRAY_500} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Locação de: {selectedReservation?.kit?.name || selectedReservation?.kitName || ''}
            </Text>

            <Text style={styles.inputLabel}>Nota (0 a 10)</Text>
            <TextInput
              style={styles.scoreInput}
              placeholder="Ex: 10"
              placeholderTextColor={GRAY_300}
              keyboardType="numeric"
              value={ratingScore}
              onChangeText={setRatingScore}
              maxLength={4}
            />

            <Text style={styles.inputLabel}>Feedback (Opcional)</Text>
            <TextInput
              style={styles.feedbackInput}
              placeholder="Ex: Entregou no prazo, tudo certo."
              placeholderTextColor={GRAY_300}
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
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveRatingBtnText}>Salvar Avaliação</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: GRAY_500,
    marginBottom: 16,
  },
  backButtonCenter: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: PRIMARY,
    borderRadius: 8,
  },
  backButtonTextCenter: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GRAY_100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GRAY_900,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GRAY_900,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: GRAY_900,
    textAlign: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleUser: {
    backgroundColor: '#E0F2FE',
  },
  roleAdmin: {
    backgroundColor: '#FEF3C7',
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  roleTextUser: {
    color: '#0284C7',
  },
  roleTextAdmin: {
    color: '#D97706',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  infoText: {
    fontSize: 15,
    color: GRAY_900,
    marginLeft: 12,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: GRAY_500,
  },
  reservationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reservationMainContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    backgroundColor: '#E5E7EB',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  reservationDetails: {
    flex: 1,
    padding: 12,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kitName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: GRAY_900,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  datesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: GRAY_500,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
    color: GRAY_900,
  },
  reservationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: GRAY_900,
  },
  ratingSection: {
    borderTopWidth: 1,
    borderTopColor: GRAY_100,
    backgroundColor: '#FAFAFA',
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  rateButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  existingRatingBox: {
    padding: 12,
  },
  ratingHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingScoreText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B45309',
  },
  ratingFeedbackText: {
    fontSize: 13,
    color: GRAY_500,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GRAY_900,
  },
  modalSubtitle: {
    fontSize: 14,
    color: GRAY_500,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: GRAY_900,
    marginBottom: 8,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: GRAY_300,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    color: GRAY_900,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: GRAY_300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    height: 100,
    fontSize: 15,
    color: GRAY_900,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  saveRatingBtn: {
    backgroundColor: PRIMARY,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveRatingBtnDisabled: {
    backgroundColor: GRAY_300,
  },
  saveRatingBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
