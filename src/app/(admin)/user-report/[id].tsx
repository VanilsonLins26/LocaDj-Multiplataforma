import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
  generalRating?: number;
  ratingCount?: number;
}

interface Rating {
  id: string;
  reservationId: number;
  rating: number;
  feedback: string;
  createdAt: any;
}

export default function UserReportScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const userId = id as string;

  const [user, setUser] = useState<User | null>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedResId, setSelectedResId] = useState<number | null>(null);
  const [ratingInput, setRatingInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch User
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        Alert.alert('Erro', 'Usuário não encontrado.');
        router.back();
        return;
      }
      const userData = { id: userSnap.id, ...userSnap.data() } as User;
      setUser(userData);

      // 2. Fetch Ratings for this user
      const ratingsQ = query(collection(db, 'ratings'), where('userId', '==', userId));
      const ratingsSnap = await getDocs(ratingsQ);
      const fetchedRatings: Rating[] = [];
      ratingsSnap.forEach(rDoc => {
        fetchedRatings.push({ id: rDoc.id, ...rDoc.data() } as Rating);
      });
      setRatings(fetchedRatings);

      // 3. Fetch Reservations from API
      const currentUser = auth.currentUser;
      if (currentUser && userData.email) {
        const idToken = await currentUser.getIdToken();
        const headers = { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        };
        const response = await fetch('https://locadj.onrender.com/api/reservations', { headers });
        if (response.ok) {
          const json = await response.json();
          const allData = Array.isArray(json) ? json : (json.value ?? []);
          // Filter by user email or user ID
          const userReservations = allData.filter((item: any) => {
            const matchEmail = item.user?.email && userData.email && item.user.email.toLowerCase() === userData.email.toLowerCase();
            const matchId = item.userId === userData.id || item.user?.id === userData.id;
            return matchEmail || matchId;
          }).sort((a: any, b: any) => b.id - a.id);
          setReservations(userReservations);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do relatório.');
    } finally {
      setLoading(false);
    }
  };

  const formatVisibleDate = (isoString?: string) => {
    if (!isoString) return '--/--/----';
    const split = isoString.split('T');
    if (split.length > 0) {
       const datePart = split[0];
       const parts = datePart.split('-');
       if (parts.length === 3) {
         const [y, m, d] = parts;
         return `${d}/${m}/${y}`;
       }
    }
    return isoString;
  };

  const openRatingModal = (reservationId: number) => {
    setSelectedResId(reservationId);
    setRatingInput('');
    setFeedbackInput('');
    setModalVisible(true);
  };

  const submitRating = async () => {
    if (!selectedResId || !user) return;
    
    const ratingNum = parseFloat(ratingInput);
    if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 10) {
      Alert.alert('Atenção', 'Digite uma nota válida entre 0 e 10.');
      return;
    }
    if (!feedbackInput.trim()) {
      Alert.alert('Atenção', 'Por favor, digite um feedback.');
      return;
    }

    try {
      setSubmitting(true);
      
      // Save rating
      const newRatingRef = await addDoc(collection(db, 'ratings'), {
        userId: user.id,
        reservationId: selectedResId,
        rating: ratingNum,
        feedback: feedbackInput.trim(),
        createdAt: serverTimestamp()
      });

      // Update user general rating
      const newRatingCount = (user.ratingCount || 0) + 1;
      // Calculate new average: ((oldAverage * oldCount) + newRating) / newCount
      const oldSum = (user.generalRating || 0) * (user.ratingCount || 0);
      const newGeneralRating = (oldSum + ratingNum) / newRatingCount;

      await updateDoc(doc(db, 'users', user.id), {
        generalRating: newGeneralRating,
        ratingCount: newRatingCount
      });

      // Update local state
      setUser({
        ...user,
        generalRating: newGeneralRating,
        ratingCount: newRatingCount
      });
      
      setRatings([...ratings, {
        id: newRatingRef.id,
        reservationId: selectedResId,
        rating: ratingNum,
        feedback: feedbackInput.trim(),
        createdAt: new Date()
      }]);

      setModalVisible(false);
      Alert.alert('Sucesso', 'Avaliação salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      Alert.alert('Erro', 'Não foi possível salvar a avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReservation = ({ item }: { item: any }) => {
    const kitName = item.kit?.name || item.kitName || `Reserva #${item.id}`;
    const startDate = item.startDateTime ? formatVisibleDate(item.startDateTime) : (item.startDate || '--/--/----');
    const endDate = item.endDateTime ? formatVisibleDate(item.endDateTime) : (item.endDate || '--/--/----');
    
    const existingRating = ratings.find(r => r.reservationId === item.id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.kitName}>{kitName}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status || 'Pendente'}</Text>
          </View>
        </View>

        <View style={styles.datesRow}>
          <Text style={styles.dateText}>Início: {startDate}</Text>
          <Text style={styles.dateText}>Fim: {endDate}</Text>
        </View>

        <View style={styles.divider} />

        {existingRating ? (
          <View style={styles.ratingSection}>
            <View style={styles.ratingHeader}>
              <Ionicons name="star" size={16} color="#FBBF24" />
              <Text style={styles.ratingScore}>Nota: {existingRating.rating.toFixed(1)}/10</Text>
            </View>
            <Text style={styles.feedbackText}>"{existingRating.feedback}"</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.rateButton}
            onPress={() => openRatingModal(item.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="star-outline" size={18} color={PRIMARY} />
            <Text style={styles.rateButtonText}>Avaliar Devolução</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={TEXT_LIGHT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatório do Usuário</Text>
        <View style={{ width: 40 }} />
      </View>

      {user && (
        <View style={styles.userInfoContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.generalRating !== undefined && (
              <View style={styles.generalRatingBadge}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.generalRatingText}>
                  Nota Geral: {user.generalRating.toFixed(1)} ({user.ratingCount} avaliações)
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Histórico de Pedidos</Text>
        <Text style={styles.sectionCount}>{reservations.length} pedidos</Text>
      </View>

      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReservation}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={TEXT_MUTED} />
            <Text style={styles.emptyText}>Este usuário ainda não fez nenhum pedido.</Text>
          </View>
        }
      />

      {/* Rating Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avaliar Reserva</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nota (0 a 10)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: 9.5"
              placeholderTextColor={TEXT_MUTED}
              keyboardType="numeric"
              value={ratingInput}
              onChangeText={setRatingInput}
            />

            <Text style={styles.inputLabel}>Feedback / Motivo da nota</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Descreva as condições da devolução..."
              placeholderTextColor={TEXT_MUTED}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={feedbackInput}
              onChangeText={setFeedbackInput}
            />

            <TouchableOpacity 
              style={[styles.saveButton, submitting && { opacity: 0.7 }]} 
              onPress={submitRating}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={PRIMARY} />
              ) : (
                <Text style={styles.saveButtonText}>Salvar Avaliação</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
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
  userInfoContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: CARD_BG,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  generalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  generalRatingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FBBF24',
    marginLeft: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
  },
  sectionCount: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  kitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: PRIMARY,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 16,
  },
  rateButton: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  rateButtonText: {
    color: PRIMARY,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  ratingSection: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FBBF24',
    marginLeft: 6,
  },
  feedbackText: {
    fontSize: 13,
    color: '#FDE68A',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: TEXT_MUTED,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT_LIGHT,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#09090B',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: TEXT_LIGHT,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  textArea: {
    height: 120,
  },
  saveButton: {
    backgroundColor: 'transparent',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  saveButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
