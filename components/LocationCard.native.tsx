import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Linking } from 'react-native';
import { COLORS } from '../constants/colors';
import { COMPANY } from '../constants/company';
import CustomIcon from './CustomIcon';
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

  const openInMaps = () => {
    const { latitude, longitude } = COMPANY.location.coordinates;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${latitude},${longitude}`;
    const label = encodeURIComponent(COMPANY.location.name);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    if (url) {
      Linking.openURL(url);
    }
  };

  // Generate static map URL using Mapbox
  const staticMapUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v10/static/pin-l+${encodeURIComponent(COLORS.primary.replace('#', ''))}(${COMPANY.location.coordinates.longitude},${COMPANY.location.coordinates.latitude})/${COMPANY.location.coordinates.longitude},${COMPANY.location.coordinates.latitude},15,0/600x300@2x?access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.mapContainer} 
        onPress={openInMaps}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: staticMapUrl }} 
          style={styles.map}
          resizeMode="cover"
        />
        <View style={styles.mapOverlay}>
          <Text style={styles.mapText}>Tap to open in maps</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.locationInfo}>
        <View style={styles.locationHeader}>
          <View style={styles.iconContainer}>
            <CustomIcon name="location" size={24} color={COLORS.primary} />
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
  map: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  mapText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
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
