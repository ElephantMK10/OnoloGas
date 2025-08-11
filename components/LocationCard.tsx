import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { COLORS } from '../constants/colors';
import { COMPANY } from '../constants/company';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';

interface LocationCardProps {
  onDeliveryRequest?: () => void;
}

export default function LocationCard({ onDeliveryRequest }: LocationCardProps) {
  const router = useRouter();

  // Mapbox coordinates
  const latitude = COMPANY.location.coordinates.latitude;
  const longitude = COMPANY.location.coordinates.longitude;

  // Create the Mapbox HTML content
  const mapboxHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no">
      <link href="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css" rel="stylesheet">
      <script src="https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js"></script>
      <style>
        body { margin: 0; padding: 0; }
        #map { position: absolute; top: 0; bottom: 0; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        mapboxgl.accessToken = 'pk.eyJ1Ijoia2tubWFsMDAzIiwiYSI6ImNtOWI2NGF1MjBjdWwya3M1Mmxua3hqaXgifQ._PMbFD1tTIq4zmjGCwnAHg';
        const map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [${longitude}, ${latitude}],
          zoom: 14
        });
        
        // Add marker
        new mapboxgl.Marker()
          .setLngLat([${longitude}, ${latitude}])
          .addTo(map);
      </script>
    </body>
    </html>
  `;

  const handleDeliveryRequest = () => {
    // Navigate to the order tab
    router.push('/(tabs)/order');
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          style={styles.map}
          originWhitelist={['*']}
          source={{ html: mapboxHtml }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
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
  map: {
    width: '100%',
    height: '100%',
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
