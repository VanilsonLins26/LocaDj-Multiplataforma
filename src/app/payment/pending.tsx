import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PRIMARY = '#5245F1';
const WHITE = '#FFFFFF';
const GRAY_100 = '#F3F4F6';
const GRAY_400 = '#9CA3AF';
const GRAY_800 = '#1F2937';
const WARNING = '#F97316';
const WARNING_LIGHT = '#FFF7ED';

const { width, height } = Dimensions.get('window');

export default function PaymentPendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();


  const scaleValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;
  const slideUpValue = useRef(new Animated.Value(50)).current;


  const pulseValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideUpValue, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ]).start(() => {

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      <View style={[styles.headerBg, { height: height * 0.35 + insets.top }]}>
        <View style={styles.headerBgPattern} />
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>


        <Animated.View style={[styles.card, {
          opacity: fadeValue,
          transform: [{ translateY: slideUpValue }]
        }]}>


          <View style={styles.iconContainer}>
            <Animated.View style={[
              styles.iconCircle,
              { transform: [{ scale: scaleValue }, { scale: pulseValue }] }
            ]}>
              <Ionicons name="time" size={44} color={WHITE} />
            </Animated.View>
          </View>

          <Text style={styles.title}>Pagamento Pendente</Text>
          <Text style={styles.subtitle}>Estamos aguardando a confirmação do seu pagamento. Isso pode levar alguns minutos.</Text>


          <View style={styles.divider} />


          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={WARNING} />
              <Text style={styles.infoText}>Sua reserva está pré-garantida. O status mudará automaticamente assim que compensado.</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={WARNING} />
              <Text style={styles.infoText}>Você também receberá um comprovante no seu e-mail assim que for concluído.</Text>
            </View>
          </View>

        </Animated.View>


        <Animated.View style={[styles.actionContainer, {
          opacity: fadeValue,
          transform: [{ translateY: slideUpValue }]
        }]}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/kits_list')} // ou para Meus Pedidos
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>Ir para Meus Pedidos</Text>
            <Ionicons name="list" size={20} color={WHITE} style={{ marginLeft: 8 }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/kits_list')}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryBtnText}>Voltar para o Início</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerBgPattern: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -width * 0.5,
    right: -width * 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 24,
    paddingTop: 56,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
    marginBottom: 32,
  },
  iconContainer: {
    position: 'absolute',
    top: -40,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: WARNING,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: '#F4F5F7',
    shadowColor: WARNING,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: GRAY_800,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: GRAY_400,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: GRAY_100,
    marginVertical: 24,
  },
  infoContainer: {
    width: '100%',
    gap: 12,
    backgroundColor: WARNING_LIGHT,
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: WARNING,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionContainer: {
    gap: 16,
    marginTop: 'auto',
    marginBottom: 40,
  },
  primaryBtn: {
    backgroundColor: WARNING,
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: WARNING,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: GRAY_800,
    fontSize: 15,
    fontWeight: '600',
  },
});
