import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { COLORS } from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import FuelTypeSelector from '../components/FuelTypeSelector';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const MAPBOX_TOKEN =
  'pk.eyJ1Ijoia2tubWFsMDAzIiwiYSI6ImNtOWI2NGF1MjBjdWwya3M1Mmxua3hqaXgifQ._PMbFD1tTIq4zmjGCwnAHg';
const ONOLO_COORDS = { latitude: -26.2041, longitude: 28.0473 }; // Johannesburg

const { width: screenWidth } = Dimensions.get('window');
const mapWidth = Math.round(screenWidth - 32);
const mapHeight = 300;

const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-l+ff6b00(${ONOLO_COORDS.longitude},${ONOLO_COORDS.latitude})/${ONOLO_COORDS.longitude},${ONOLO_COORDS.latitude},12/${mapWidth}x${mapHeight}@2x?access_token=${MAPBOX_TOKEN}`;

// Main Home Screen - accessible to both guests and authenticated users
export default function HomeScreen() {
  const router = useRouter();

  const handleDeliveryRequest = () => {
    router.push('/(tabs)/order');
  };

  const dotOpacity = useSharedValue(1);

  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [dotOpacity]);

  const animatedDotStyle = useAnimatedStyle(() => {
    return {
      opacity: dotOpacity.value,
    };
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: staticMapUrl }}
          style={styles.mapContainer}
          imageStyle={styles.mapImage}
        >
          <View style={styles.mapOverlay} pointerEvents="none" />
          <View style={styles.locationCard}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Onolo Gas</Text>
              <Text style={styles.locationAddress}>Johannesburg, South Africa</Text>
              <View style={styles.hoursContainer}>
                <Animated.View style={[styles.hoursDot, animatedDotStyle]} />
                <Text style={styles.hoursText}>Open from 8 am to 4 pm</Text>
              </View>
              <TouchableOpacity style={styles.deliveryButton} onPress={handleDeliveryRequest}>
                <Text style={styles.deliveryButtonText}>Ask for a delivery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
        <FuelTypeSelector />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  mapImage: {
    borderRadius: 16,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 1,
  },
  locationCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(34, 34, 34, 0.9)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    color: COLORS.text.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationAddress: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 8,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hoursDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  hoursText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  deliveryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deliveryButtonText: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
