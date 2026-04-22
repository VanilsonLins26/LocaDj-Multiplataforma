import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BarChart, PieChart } from 'react-native-gifted-charts';

const { width } = Dimensions.get('window');

const BG = '#F4F5F8';
const HEADER = '#5145CD';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1F2937';
const TEXT_LIGHT = '#6B7280';

// Gráficos Cores
const PIE_COLORS = ['#5145CD', '#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6'];

interface DashboardData {
  userCount: number;
  availableKitsCount: number;
  activeReservationsCount: number;
  topKitsData: {
    kits: string[];
    reservations: number[];
  };
  reservationsData: {
    months: string[];
    reservations: number[];
  };
}

import { auth } from '../config/firebaseConfig';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPieInfo, setSelectedPieInfo] = useState<{name: string, value: number} | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const currentUser = auth.currentUser;
        const idToken = currentUser ? await currentUser.getIdToken() : null;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }
        const response = await fetch('https://locadj.onrender.com/api/admin/dashboard', { headers });
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatBarChartData = () => {
    if (!data?.reservationsData?.months) return [];
    
    const monthMap: Record<string, string> = {
      'JANUARY': 'Jan', 'FEBRUARY': 'Fev', 'MARCH': 'Mar', 'APRIL': 'Abr', 'MAY': 'Mai', 'JUNE': 'Jun',
      'JULY': 'Jul', 'AUGUST': 'Ago', 'SEPTEMBER': 'Set', 'OCTOBER': 'Out', 'NOVEMBER': 'Nov', 'DECEMBER': 'Dez'
    };

    const monthsInfo = data.reservationsData.months.slice(0, 6).reverse();
    const valuesInfo = data.reservationsData.reservations.slice(0, 6).reverse();

    return monthsInfo.map((m, index) => {
       const parts = m.split(' ');
       const monthEng = parts[0];
       const yearFull = parts[1] || "";
       const yearShort = yearFull.length === 4 ? yearFull.substring(2) : yearFull;
       const ptMonth = monthMap[monthEng] || monthEng.substring(0, 3);
       
       return {
         value: valuesInfo[index] || 0,
         label: `${ptMonth}/${yearShort}`,
         frontColor: '#5145CD',
       };
    });
  };

  const formatPieChartData = () => {
    if (!data?.topKitsData?.kits) return [];
    
    return data.topKitsData.kits.map((kitName, index) => {
        let cleanName = kitName;
        // Tratamento mais seguro contra caracteres corrompidos
        if (cleanName.includes('ǭ') || cleanName.includes('sico')) cleanName = 'Kit Básico DJ';
        else if (cleanName.includes('Avan') || cleanName.includes('\ufffdados')) cleanName = 'Kit Avançado DJ';
        else if (cleanName.includes('Acess') || cleanName.includes('rios')) cleanName = 'Kit Acessórios';
        else if (cleanName.includes('Ilumina') || cleanName.includes('ǜ')) cleanName = 'Kit Iluminação';
        else if (cleanName.includes('Microfones')) cleanName = 'Kit Microfones';
        else if (cleanName.includes('Som')) cleanName = 'Kit Som';

        return {
            value: data.topKitsData.reservations[index] || 0,
            color: PIE_COLORS[index % PIE_COLORS.length],
            text: cleanName,
        };
    });
  };

  const rawPieData = formatPieChartData();
  const pieData = rawPieData.filter(item => item.value > 0).map(item => ({
    ...item,
    focused: selectedPieInfo?.name === item.text
  }));
  const barData = formatBarChartData();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={HEADER} />

      <View style={[styles.headerBg, { paddingTop: Math.max(insets.top, 20) }]}>
         <Text style={styles.headerTitle}>Loca DJ</Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={HEADER} />
          </View>
        ) : (
          <>
            <View style={styles.titleSection}>
                <Text style={styles.pageTitle}>Painel de Administração</Text>
                <Text style={styles.pageSubtitle}>Estatísticas Rápidas</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardLeft}>
                 <Text style={styles.cardLabel}>Total de Usuários</Text>
                 <Text style={styles.cardValue}>{data?.userCount || 0}</Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#E0E7FF' }]}>
                 <Ionicons name="person" size={20} color="#5145CD" />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardLeft}>
                 <Text style={styles.cardLabel}>Kits Disponíveis</Text>
                 <Text style={styles.cardValue}>{data?.availableKitsCount || 0}</Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                 <Ionicons name="cube" size={20} color="#16A34A" />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardLeft}>
                 <Text style={styles.cardLabel}>Reservas Ativas</Text>
                 <Text style={styles.cardValue}>{data?.activeReservationsCount || 0}</Text>
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                 <Ionicons name="calendar" size={20} color="#2563EB" />
              </View>
            </View>

            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Reservas por Mês</Text>
                {barData.length > 0 ? (
                  <View style={{ marginTop: 20 }}>
                    <BarChart
                      data={barData}
                      barWidth={26}
                      spacing={30}
                      roundedTop
                      hideRules
                      xAxisThickness={1}
                      xAxisColor="#E5E7EB"
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: TEXT_LIGHT, fontSize: 11 }}
                      xAxisLabelTextStyle={{ color: TEXT_LIGHT, fontSize: 9.5, textAlign: 'center' }}
                      noOfSections={4}
                      isAnimated
                      renderTooltip={(item: any) => {
                        return (
                          <View style={{ marginBottom: 5, backgroundColor: HEADER, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 }}>
                            <Text style={{ color: WHITE, fontWeight: 'bold', fontSize: 12 }}>{item.value}</Text>
                          </View>
                        );
                      }}
                    />
                  </View>
                ) : (
                    <Text style={styles.noDataText}>Sem dados suficientes.</Text>
                )}
            </View>

            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Kits Mais Alugados</Text>
                {pieData.length > 0 ? (
                   <View style={styles.pieContainer}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <PieChart
                          data={pieData}
                          donut={false}
                          radius={85}
                          innerRadius={0}
                          toggleFocusOnPress={false}
                          onPress={(item: any) => setSelectedPieInfo({ name: item.text, value: item.value })}
                        />
                      </View>
                      
                      <View style={styles.legendContainer}>
                        {pieData.map((item, idx) => (
                           <View key={idx} style={styles.legendItem}>
                              <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                              <Text style={styles.legendText} numberOfLines={1}>
                                {item.value} - {item.text}
                              </Text>
                           </View>
                        ))}
                      </View>
                   </View>
                ) : (
                    <Text style={styles.noDataText}>Sem dados suficientes.</Text>
                )}

                {/* Info Tooltip customizada ao clicar na pizza */}
                {selectedPieInfo && (
                  <View style={styles.tooltipContainer}>
                     <Text style={styles.tooltipTitle}>{selectedPieInfo.name}</Text>
                     <Text style={styles.tooltipValue}>
                        <Text style={{fontWeight: 'bold', color: HEADER}}>{selectedPieInfo.value}</Text> locações registradas
                     </Text>
                  </View>
                )}
            </View>
          </>
        )}
      </ScrollView>

      <View style={[styles.bottomNavContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomNavInner}>
          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
            <Ionicons name={activeTab === 'home' ? 'home' : 'home-outline'} size={24} color={activeTab === 'home' ? HEADER : TEXT_LIGHT} />
            <Text style={[styles.navText, activeTab === 'home' && { color: HEADER }]}>Início</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('users')}>
            <Ionicons name={activeTab === 'users' ? 'people' : 'people-outline'} size={24} color={activeTab === 'users' ? HEADER : TEXT_LIGHT} />
            <Text style={[styles.navText, activeTab === 'users' && { color: HEADER }]}>Usuários</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('kits')}>
            <Ionicons name={activeTab === 'kits' ? 'cube' : 'cube-outline'} size={24} color={activeTab === 'kits' ? HEADER : TEXT_LIGHT} />
            <Text style={[styles.navText, activeTab === 'kits' && { color: HEADER }]}>Kits</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('reservations')}>
            <Ionicons name={activeTab === 'reservations' ? 'calendar' : 'calendar-outline'} size={24} color={activeTab === 'reservations' ? HEADER : TEXT_LIGHT} />
            <Text style={[styles.navText, activeTab === 'reservations' && { color: HEADER }]}>Reservas</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
            <Ionicons name={activeTab === 'profile' ? 'person' : 'person-outline'} size={24} color={activeTab === 'profile' ? HEADER : TEXT_LIGHT} />
            <Text style={[styles.navText, activeTab === 'profile' && { color: HEADER }]}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  headerBg: {
    backgroundColor: HEADER,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    color: WHITE,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  loadingContainer: {
    flex: 1,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
      marginBottom: 20,
  },
  pageTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: TEXT_DARK,
      marginBottom: 4,
  },
  pageSubtitle: {
      fontSize: 14,
      color: TEXT_LIGHT,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLeft: {
      flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    color: TEXT_LIGHT,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },
  iconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
  },
  chartCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden'
  },
  chartTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: TEXT_DARK,
      marginBottom: 8,
  },
  noDataText: {
      color: TEXT_LIGHT,
      textAlign: 'center',
      marginVertical: 20,
  },
  pieContainer: {
      flexDirection: 'column',
      alignItems: 'center',
      marginTop: 20,
      width: '100%'
  },
  legendContainer: {
      marginTop: 20,
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
  },
  legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '48%', 
      marginBottom: 12,
  },
  legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
  },
  legendText: {
      fontSize: 12,
      color: TEXT_LIGHT,
      flex: 1,
  },
  tooltipContainer: {
      marginTop: 20,
      padding: 14,
      backgroundColor: '#EFF6FF',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#BFDBFE',
      alignItems: 'center'
  },
  tooltipTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: TEXT_DARK,
      marginBottom: 4
  },
  tooltipValue: {
      fontSize: 13,
      color: TEXT_LIGHT
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: WHITE,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomNavInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 10,
    color: TEXT_LIGHT,
    marginTop: 4,
    fontWeight: '500',
  },
});