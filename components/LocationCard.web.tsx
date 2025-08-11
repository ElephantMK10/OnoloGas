import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { COMPANY } from '../constants/company';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { useRouter } from 'expo-router';

interface LocationCardProps {
  onDeliveryRequest?: () => void;
}

export default function LocationCard({ onDeliveryRequest }: LocationCardProps) {
  const router = useRouter();

  const handleDeliveryRequest = () => {
    // Navigate to the order tab
    router.push('/(tabs)/order');
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="location-outline" size={32} color={COLORS.text.gray} />
          <Text style={styles.mapPlaceholderText}>
            {COMPANY.location.fullAddress.street}, {COMPANY.location.fullAddress.area}
          </Text>
        </View>
      </View>
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="location" size={24} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.locationName}>{COMPANY.location.name}</Text>
            <Text style={styles.locationAddress}>{COMPANY.location.address}</Text>
          </View>
        </View>
        <View style={styles.hoursContainer}>
          <View style={styles.dot} />
          <Text style={styles.hours}>{COMPANY.location.hours}</Text>
        </View>
        <Button title="Ask for a delivery" onPress={handleDeliveryRequest} style={styles.button} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  mapContainer: {
    height: 150,
    backgroundColor: '#1A1A1A',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: COLORS.text.gray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  locationInfo: {
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationName: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationAddress: {
    color: COLORS.text.gray,
    fontSize: 14,
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  hours: {
    color: COLORS.text.gray,
    fontSize: 14,
  },
  button: {
    marginTop: 8,
  },
});
