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
  View,
  Image,
  Platform
} from 'react-native';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../../config/firebaseConfig';

const { width } = Dimensions.get('window');

// Cores do tema escuro
const BG = '#09090B';
const CARD_BG = '#09090B'; // Fundo do card igual ao fundo principal, só a borda destaca
const TEXT_LIGHT = '#FFFFFF';
const TEXT_MUTED = '#A1A1AA';

// Cores Neon
const COLOR_USERS = '#8B5CF6'; // Roxo
const COLOR_KITS = '#2DD4BF';  // Ciano
const COLOR_RESERVATIONS = '#EC4899'; // Rosa

// Gráficos Cores Neon
const PIE_COLORS = ['#8B5CF6', '#2DD4BF', '#EC4899', '#A3E635', '#F59E0B', '#3B82F6'];

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

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          };

          const response = await fetch('https://locadj.onrender.com/api/admin/dashboard', { headers });
          if (response.ok) {
            const json = await response.json();
            setData(json);
          } else {
            console.error('Failed to fetch dashboard data, status:', response.status);
          }
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatBarChartData = () => {
    if (!data?.reservationsData?.months) return [];

    const monthMap: Record<string, string> = {
      'JANUARY': 'Jan', 'FEBRUARY': 'Fev', 'MARCH': 'Mar', 'APRIL': 'Abr', 'MAY': 'Mai', 'JUNE': 'Jun',
      'JULY': 'Jul', 'AUGUST': 'Ago', 'SEPTEMBER': 'Set', 'OCTOBER': 'Out', 'NOVEMBER': 'Nov', 'DECEMBER': 'Dez'
    };

    const monthsInfo = data.reservationsData.months.slice(0, 5).reverse();
    const valuesInfo = data.reservationsData.reservations.slice(0, 5).reverse();

    return monthsInfo.map((m, index) => {
      const parts = m.split(' ');
      const monthEng = parts[0];
      const yearFull = parts[1] || "";
      const yearShort = yearFull.length === 4 ? yearFull.substring(2) : yearFull;
      const ptMonth = monthMap[monthEng] || monthEng.substring(0, 3);

      return {
        value: valuesInfo[index] || 0,
        label: `${ptMonth}/${yearShort}`,
        frontColor: '#8B5CF6',
        topLabelComponent: () => (
          <Text style={{color: '#8B5CF6', fontSize: 10, marginBottom: 4}}></Text>
        )
      };
    });
  };

  const formatPieChartData = () => {
    if (!data?.topKitsData?.kits) return [];

    return data.topKitsData.kits.map((kitName, index) => {
      let cleanName = kitName;
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

  const pieData = formatPieChartData().filter(item => item.value > 0);
  const barData = formatBarChartData();

  // Determinar se estamos em uma tela grande (web/desktop)
  const isLargeScreen = width >= 768;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header Centralizado - Loca DJ */}
      <View style={[styles.headerTop, { paddingTop: Math.max(insets.top, 20) }]}>
        <Text style={styles.headerLogoText}>Loca DJ</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLOR_USERS} />
          </View>
        ) : (
          <>
            <View style={styles.titleSection}>
              <Text style={styles.pageTitle}>Painel de Administração</Text>
              <Text style={styles.pageSubtitle}>Estatísticas Rápidas</Text>
            </View>

            {/* Cards de Resumo */}
            <View style={[styles.summaryCardsContainer, isLargeScreen && { flexDirection: 'row' }]}>
              {/* Card Usuários */}
              <View style={[styles.card, { borderColor: COLOR_USERS }, isLargeScreen && { flex: 1 }]}>
                <View style={[styles.iconCircle, { borderColor: COLOR_USERS }]}>
                  <Ionicons name="people-outline" size={24} color={COLOR_USERS} />
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardLabel}>Total de Usuários</Text>
                  <Text style={styles.cardValue}>{data?.userCount || 0}</Text>
                </View>
              </View>

              {/* Card Kits */}
              <View style={[styles.card, { borderColor: COLOR_KITS }, isLargeScreen && { flex: 1 }]}>
                <View style={[styles.iconCircle, { borderColor: COLOR_KITS }]}>
                  <Ionicons name="cube-outline" size={24} color={COLOR_KITS} />
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardLabel}>Kits Disponíveis</Text>
                  <Text style={styles.cardValue}>{data?.availableKitsCount || 0}</Text>
                </View>
              </View>

              {/* Card Reservas */}
              <View style={[styles.card, { borderColor: COLOR_RESERVATIONS }, isLargeScreen && { flex: 1 }]}>
                <View style={[styles.iconCircle, { borderColor: COLOR_RESERVATIONS }]}>
                  <Ionicons name="calendar-outline" size={24} color={COLOR_RESERVATIONS} />
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardLabel}>Reservas Ativas</Text>
                  <Text style={styles.cardValue}>{data?.activeReservationsCount || 0}</Text>
                </View>
              </View>
            </View>

            {/* Gráficos */}
            <View style={[styles.chartsContainer, isLargeScreen && { flexDirection: 'row' }]}>
              {/* Gráfico de Barras */}
              <View style={[styles.chartCard, isLargeScreen && { flex: 1 }]}>
                <Text style={styles.chartTitle}>Reservas por Mês</Text>
                {barData.length > 0 ? (
                  <View style={{ marginTop: 20, alignItems: 'center', marginLeft: -20 }}>
                    <BarChart
                      data={barData}
                      barWidth={18}
                      spacing={isLargeScreen ? 60 : 30}
                      roundedTop
                      hideRules
                      xAxisThickness={1}
                      xAxisColor="#27272A"
                      yAxisThickness={0}
                      yAxisTextStyle={{ color: TEXT_MUTED, fontSize: 11 }}
                      xAxisLabelTextStyle={{ color: TEXT_MUTED, fontSize: 10, textAlign: 'center' }}
                      noOfSections={4}
                      isAnimated
                      frontColor="#8B5CF6"
                    />
                  </View>
                ) : (
                  <Text style={styles.noDataText}>Sem dados suficientes.</Text>
                )}
              </View>

              {/* Gráfico de Pizza */}
              <View style={[styles.chartCard, isLargeScreen && { flex: 1 }]}>
                <Text style={styles.chartTitle}>Kits Mais Alugados</Text>
                {pieData.length > 0 ? (
                  <View style={[styles.pieContainer, isLargeScreen && { flexDirection: 'row' }]}>
                    <View style={styles.pieChartWrapper}>
                      <PieChart
                        data={pieData}
                        donut={true}
                        radius={isLargeScreen ? 110 : 90}
                        innerRadius={isLargeScreen ? 60 : 45}
                        innerCircleColor={BG}
                        centerLabelComponent={() => {
                          return (
                            <View style={styles.centerRecord}>
                              <Image source={require('../../../assets/images/dados.gif')} style={styles.logo} resizeMode="contain" />
                            </View>
                          );
                        }}
                      />
                    </View>

                    <View style={[styles.legendContainer, isLargeScreen && { flex: 1, marginTop: 0, paddingLeft: 20 }]}>
                      {pieData.map((item, idx) => (
                        <View key={idx} style={styles.legendItem}>
                          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                          <Text style={styles.legendText} numberOfLines={1}>
                            <Text style={{fontWeight: 'bold', color: TEXT_LIGHT}}>{item.value}</Text> - {item.text}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>Sem dados suficientes.</Text>
                )}
              </View>
            </View>
          </>
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
  headerTop: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#18181B',
  },
  headerLogoText: {
    color: TEXT_LIGHT,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  loadingContainer: {
    flex: 1,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleSection: {
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
  },
  summaryCardsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  cardRight: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: TEXT_LIGHT,
  },
  chartsContainer: {
    gap: 16,
  },
  chartCard: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 24,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT_LIGHT,
    marginBottom: 24,
  },
  noDataText: {
    color: TEXT_MUTED,
    textAlign: 'center',
    marginVertical: 40,
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRecord: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    borderRadius: 30,
    
    overflow: 'hidden',
  },
  logo: {
    width: 110,
    height: 110,
  },
  legendContainer: {
    marginTop: 32,
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  legendText: {
    fontSize: 13,
    color: TEXT_MUTED,
    flex: 1,
  }
});