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

const BG = '#09090B';
const CARD_BG = '#09090B';
const BORDER = '#27272A';
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';
const PRIMARY = '#8B5CF6';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
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
  const [activeTab, setActiveTab] = useState<'locacoes' | 'feedbacks'>('locacoes');

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
      const newRatings = {
        ...(user.ratings || {}),
        [selectedReservation.id]: {
          score: scoreNum,
          feedback: ratingFeedback.trim(),
          createdAt: new Date().toISOString()
        }
      };
      
      if (user.id === 'mock-user-123') {
        setUser({ ...user, ratings: newRatings });
      } else {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { ratings: newRatings });
        setUser({ ...user, ratings: newRatings });
      }
      
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

      if (id === 'mock-user-123') {
        const mockUser: User = {
          id: 'mock-user-123',
          name: 'Usuário Exemplo',
          email: 'exemplo@locadj.com',
          phone: '(11) 98765-4321',
          role: 'user',
          cpf: '123.456.789-00',
          avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=Felix&backgroundColor=b6e3f4',
          createdAt: new Date().toISOString(),
          ratings: {
            'loc1': { score: 10, feedback: 'Excelente!', createdAt: new Date().toISOString() },
            'loc2': { score: 8, feedback: 'Entregou um pouco atrasado.', createdAt: new Date().toISOString() },
            'loc3': { score: 9, feedback: 'Ótimo estado.', createdAt: new Date().toISOString() }
          }
        };
        
        const mockReservations = [
          {
            id: 'loc1',
            kit: { name: 'Kit CDJ 2000 Nexus + DJM 900' },
            startDateTime: new Date().toISOString(),
            endDateTime: new Date(Date.now() + 86400000).toISOString(),
            totalAmount: 450.00,
            daily: 1,
            status: 'CONCLUIDA',
            user: { email: 'exemplo@locadj.com' }
          },
          {
            id: 'loc2',
            kit: { name: 'Pioneer DDJ-1000' },
            startDateTime: new Date(Date.now() - 86400000 * 5).toISOString(),
            endDateTime: new Date(Date.now() - 86400000 * 3).toISOString(),
            totalAmount: 300.00,
            daily: 2,
            status: 'CONCLUIDA',
            user: { email: 'exemplo@locadj.com' }
          },
          {
            id: 'loc3',
            kit: { name: 'Kit Caixa Ativa JBL' },
            startDateTime: new Date(Date.now() - 86400000 * 10).toISOString(),
            endDateTime: new Date(Date.now() - 86400000 * 9).toISOString(),
            totalAmount: 150.00,
            daily: 1,
            status: 'CONCLUIDA',
            user: { email: 'exemplo@locadj.com' }
          },
          {
            id: 'loc4',
            kit: { name: 'Mesa de Som Yamaha 10 canais' },
            startDateTime: new Date(Date.now() - 86400000 * 15).toISOString(),
            endDateTime: new Date(Date.now() - 86400000 * 13).toISOString(),
            totalAmount: 120.00,
            daily: 2,
            status: 'CONCLUIDA',
            user: { email: 'exemplo@locadj.com' }
          }
        ];

        setUser(mockUser);
        setReservations(mockReservations);
        setLoading(false);
        return;
      }

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

      const currentUser = auth.currentUser;
      if (currentUser && fetchedUser.email) {
        const idToken = await currentUser.getIdToken();
        const headers: Record<string, string> = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        };

        const BASE_URL = 'https://locadj.onrender.com/api/reservations/all';
        const listResp = await fetch(BASE_URL, { headers });
        let allData: any[] = [];
        
        if (listResp.ok) {
          const json = await listResp.json();
          allData = Array.isArray(json) ? json : (json.value ?? []);
        }

        const uniqueIds = new Set();
        const finalData = allData
          .filter((item) => {
            if (!item || !item.id || !item.user?.email) return false;
            if (item.user.email.toLowerCase() !== fetchedUser.email.toLowerCase()) return false;
            
            const idStr = String(item.id);
            if (uniqueIds.has(idStr)) return false;
            uniqueIds.add(idStr);
            return true;
          })
          .sort((a, b) => Number(b.id) - Number(a.id));

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
        <View style={[styles.badge, { backgroundColor: '#78350F', borderColor: '#F59E0B' }]}>
          <Text style={[styles.badgeText, { color: '#FBBF24' }]}>Pendente</Text>
        </View>
      );
    }
    if (s === 'CONFIRMADA' || s === 'CONCLUIDA') {
      return (
        <View style={[styles.badge, { backgroundColor: '#064E3B', borderColor: '#059669' }]}>
          <Text style={[styles.badgeText, { color: '#34D399' }]}>
            {s === 'CONCLUIDA' ? 'Concluída' : 'Confirmada'}
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.badge, { backgroundColor: '#1E3A8A', borderColor: '#3B82F6' }]}>
        <Text style={[styles.badgeText, { color: '#93C5FD' }]}>{s.replace('_', ' ')}</Text>
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

  // Cálculos de Reputação
  let ratingCount = 0;
  let totalScore = 0;
  if (user.ratings) {
    const ratingsArray = Object.values(user.ratings);
    ratingCount = ratingsArray.length;
    totalScore = ratingsArray.reduce((acc, curr: any) => acc + curr.score, 0);
  }
  const avgScore = ratingCount > 0 ? totalScore / ratingCount : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Usuário</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Informações do Usuário */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          <View style={styles.infoCard}>
            <View style={styles.avatarLarge}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatarImgLarge} />
              ) : (
                <Text style={styles.avatarTextLarge}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </Text>
              )}
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={[styles.roleBadge, user.role === 'admin' ? styles.roleAdmin : styles.roleUser, { alignSelf: 'center', marginBottom: 12 }]}>
              <Text style={[styles.roleText, user.role === 'admin' ? styles.roleTextAdmin : styles.roleTextUser]}>
                {user.role === 'admin' ? 'Admin' : 'Usuário'}
              </Text>
            </View>

            {/* Painel de Reputação (Avaliações) */}
            <View style={styles.reputationBox}>
              <Ionicons name="star" size={20} color={ratingCount > 0 ? "#F59E0B" : TEXT_MUTED} />
              <View style={styles.reputationTexts}>
                <Text style={styles.reputationTitle}>Reputação do Cliente</Text>
                <Text style={styles.reputationSubtitle}>
                  {ratingCount > 0 
                    ? `Nota Média: ${Number.isInteger(avgScore) ? avgScore : avgScore.toFixed(1)}/10 (${ratingCount} avaliações)` 
                    : 'Nenhuma avaliação recebida ainda.'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={PRIMARY} />
              <Text style={styles.infoText}>{user.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={PRIMARY} />
              <Text style={styles.infoText}>{user.phone || 'Sem telefone cadastrado'}</Text>
            </View>
            {user.cpf && (
              <View style={styles.infoRow}>
                <Ionicons name="card-outline" size={20} color={PRIMARY} />
                <Text style={styles.infoText}>CPF: {user.cpf}</Text>
              </View>
            )}
            {user.createdAt && (
              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
                <Ionicons name="calendar-outline" size={20} color={PRIMARY} />
                <Text style={styles.infoText}>Cadastrado em: {formatDateString(user.createdAt)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Abas de Navegação */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'locacoes' && styles.tabButtonActive]}
            onPress={() => setActiveTab('locacoes')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'locacoes' && styles.tabButtonTextActive]}>
              Locações ({reservations.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'feedbacks' && styles.tabButtonActive]}
            onPress={() => setActiveTab('feedbacks')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'feedbacks' && styles.tabButtonTextActive]}>
              Feedbacks ({ratingCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Locações do Usuário */}
        {activeTab === 'locacoes' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico de Locações</Text>
          
          {reservations.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Ionicons name="calendar-clear-outline" size={48} color={BORDER} />
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
              const existingRating = user?.ratings?.[String(item.id)];

              return (
                <View key={item.id} style={styles.reservationCard}>
                  <View style={styles.reservationMainContent}>
                    <View style={styles.imageContainer}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="disc-outline" size={24} color={PRIMARY} />
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
                        <Text style={styles.durationText}>{daily} {daily > 1 ? 'dias' : 'dia'}</Text>
                      </View>
                      <View style={[styles.dateCol, { alignItems: 'flex-start', paddingLeft: 40 }]}>
                        <Text style={styles.dateLabel}>FIM</Text>
                        <Text style={styles.dateValue}>{endDate}</Text>
                      </View>
                    </View>
                    <View style={styles.reservationFooter}>
                      <Text style={styles.priceText}>{price}</Text>
                    </View>
                  </View>
                  </View>

                  {/* Rating Section */}
                  {(existingRating || item.status === 'CONCLUIDA') && (
                    <View style={styles.ratingSection}>
                      {existingRating ? (
                        <View style={styles.existingRatingBox}>
                          <View style={styles.ratingHeaderBox}>
                            <Ionicons name="star" size={14} color="#EAB308" />
                            <Text style={styles.ratingScoreText}>Nota: {existingRating.score}/10</Text>
                          </View>
                          {existingRating.feedback ? (
                            <Text style={styles.ratingFeedbackText}>Feedback: <Text style={{fontStyle: 'italic'}}>{existingRating.feedback}</Text></Text>
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
                  )}
                </View>
              );
            })
          )}
          </View>
        )}

        {/* Histórico de Avaliações */}
        {activeTab === 'feedbacks' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Feedbacks Recebidos</Text>
            {Object.entries(user.ratings)
              .sort((a, b) => new Date(b[1].createdAt).getTime() - new Date(a[1].createdAt).getTime())
              .map(([resId, rating]) => {
                const relatedRes = reservations.find(r => String(r.id) === resId);
                const kitNameText = relatedRes?.kit?.name || relatedRes?.kitName || 'Locação Finalizada';
                
                return (
                  <View key={resId} style={styles.feedbackCard}>
                    <View style={styles.feedbackHeader}>
                      <Text style={styles.feedbackKitName} numberOfLines={1}>{kitNameText}</Text>
                      <View style={styles.feedbackScoreBadge}>
                        <Ionicons name="star" size={12} color="#D97706" />
                        <Text style={styles.feedbackScoreText}>{rating.score}</Text>
                      </View>
                    </View>
                    <Text style={styles.feedbackDate}>{formatDateString(rating.createdAt)}</Text>
                    {rating.feedback ? (
                      <Text style={styles.feedbackText}>"{rating.feedback}"</Text>
                    ) : (
                      <Text style={styles.feedbackTextEmpty}>Nenhum comentário adicionado pelo administrador.</Text>
                    )}
                  </View>
                );
            })}
            {(!user?.ratings || Object.keys(user.ratings).length === 0) && (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={BORDER} />
                <Text style={styles.emptyText}>Nenhum feedback recebido ainda.</Text>
              </View>
            )}
          </View>
        )}
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
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Locação de: {selectedReservation?.kit?.name || selectedReservation?.kitName || ''}
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
              placeholder="Ex: Entregou no prazo, tudo certo."
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
    backgroundColor: BG,
  },
  errorText: {
    fontSize: 16,
    color: TEXT_MUTED,
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
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#18181B',
    borderWidth: 2,
    borderColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImgLarge: {
    width: '100%',
    height: '100%',
  },
  avatarTextLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    textAlign: 'center',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleUser: {
    backgroundColor: '#2E1065',
  },
  roleAdmin: {
    backgroundColor: '#78350F',
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  roleTextUser: {
    color: '#C084FC',
  },
  roleTextAdmin: {
    color: '#FBBF24',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  infoText: {
    fontSize: 14,
    color: '#D4D4D8',
    marginLeft: 12,
    flex: 1,
  },
  reputationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  reputationTexts: {
    marginLeft: 12,
    flex: 1,
  },
  reputationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  reputationSubtitle: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: TEXT_MUTED,
  },
  reservationCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    overflow: 'hidden',
  },
  reservationMainContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 80,
    backgroundColor: '#18181B',
    borderRightWidth: 1,
    borderRightColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181B',
  },
  reservationDetails: {
    flex: 1,
    padding: 16,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kitName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  datesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: TEXT_MUTED,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  durationText: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '600',
  },
  reservationFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
  },
  ratingSection: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: '#09090B',
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
    paddingHorizontal: 16,
  },
  ratingHeaderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingScoreText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EAB308',
  },
  ratingFeedbackText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: BORDER,
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
    fontWeight: '700',
    color: TEXT_LIGHT,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_LIGHT,
    marginBottom: 8,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#3F3F46',
    backgroundColor: '#18181B',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    color: TEXT_LIGHT,
    marginBottom: 16,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#3F3F46',
    backgroundColor: '#18181B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    height: 100,
    fontSize: 15,
    color: TEXT_LIGHT,
    marginBottom: 24,
  },
  saveRatingBtn: {
    backgroundColor: PRIMARY,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveRatingBtnDisabled: {
    backgroundColor: '#4C1D95',
    opacity: 0.5,
  },
  saveRatingBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  feedbackCard: {
    backgroundColor: CARD_BG,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedbackKitName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_LIGHT,
    flex: 1,
    marginRight: 12,
  },
  feedbackScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feedbackScoreText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D97706',
    marginLeft: 4,
  },
  feedbackDate: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#E4E4E7',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  feedbackTextEmpty: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#27272A',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  tabButtonTextActive: {
    color: TEXT_LIGHT,
  },
});
