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

const PRIMARY = '#5B4EE4';
const GRAY_100 = '#F3F4F6';
const GRAY_300 = '#D1D5DB';
const GRAY_500 = '#6B7280';
const GRAY_700 = '#374151';
const GRAY_900 = '#111827';

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
              <Ionicons name="star" size={16} color="#D97706" />
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
            <Ionicons name="star-outline" size={18} color="#FFF" />
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
          <Ionicons name="arrow-back" size={24} color={GRAY_900} />
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
                <Ionicons name="star" size={14} color="#D97706" />
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
            <Ionicons name="cube-outline" size={48} color={GRAY_300} />
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
                <Ionicons name="close" size={24} color={GRAY_500} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nota (0 a 10)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ex: 9.5"
              keyboardType="numeric"
              value={ratingInput}
              onChangeText={setRatingInput}
            />

            <Text style={styles.inputLabel}>Feedback / Motivo da nota</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Descreva as condições da devolução..."
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
                <ActivityIndicator color="#FFF" />
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
    backgroundColor: '#F4F5F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
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
  userInfoContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: GRAY_100,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
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
    color: GRAY_900,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: GRAY_500,
    marginBottom: 8,
  },
  generalRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  generalRatingText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D97706',
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
    color: GRAY_700,
  },
  sectionCount: {
    fontSize: 14,
    color: GRAY_500,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    color: GRAY_900,
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
    color: GRAY_500,
  },
  divider: {
    height: 1,
    backgroundColor: GRAY_100,
    marginBottom: 16,
  },
  rateButton: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  rateButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  ratingSection: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D97706',
    marginLeft: 6,
  },
  feedbackText: {
    fontSize: 13,
    color: '#92400E',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: GRAY_500,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
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
    color: GRAY_900,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GRAY_700,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: GRAY_100,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: GRAY_900,
    marginBottom: 20,
  },
  textArea: {
    height: 120,
  },
  saveButton: {
    backgroundColor: PRIMARY,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
