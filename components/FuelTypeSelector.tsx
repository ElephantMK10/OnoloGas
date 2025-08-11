import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useRouter } from 'expo-router';

type FuelType = 'gas' | 'petrol' | 'diesel';

export default function FuelTypeSelector() {
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('gas');
  const router = useRouter();

  const handleFuelSelect = (fuelType: FuelType) => {
    setSelectedFuel(fuelType);

    if (fuelType === 'petrol' || fuelType === 'diesel') {
      Alert.alert(
        `${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} Information`,
        `For more information about our ${fuelType} products and services, please contact us directly at +27 11 464 5073 or email us at info@onologroup.com.`,
        [{ text: 'OK', onPress: () => setSelectedFuel('gas') }],
      );
      return;
    }

    // Navigate to main order tab instead of gas-refill
    router.push('/(tabs)/order');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Fuel Type</Text>

      <View style={styles.fuelTypes}>
        <TouchableOpacity
          style={[styles.fuelOption, selectedFuel === 'diesel' && styles.selectedFuelOption]}
          onPress={() => handleFuelSelect('diesel')}
        >
          <Ionicons
            name="speedometer-outline"
            size={32}
            color={selectedFuel === 'diesel' ? COLORS.text.white : COLORS.text.gray}
          />
          <Text style={[styles.fuelName, selectedFuel === 'diesel' && styles.selectedFuelText]}>
            Diesel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fuelOption, selectedFuel === 'gas' && styles.selectedFuelOption]}
          onPress={() => handleFuelSelect('gas')}
        >
          <Ionicons
            name="flame-outline"
            size={32}
            color={selectedFuel === 'gas' ? COLORS.text.white : COLORS.text.gray}
          />
          <Text style={[styles.fuelName, selectedFuel === 'gas' && styles.selectedFuelText]}>
            Gas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fuelOption, selectedFuel === 'petrol' && styles.selectedFuelOption]}
          onPress={() => handleFuelSelect('petrol')}
        >
          <Ionicons
            name="car-outline"
            size={32}
            color={selectedFuel === 'petrol' ? COLORS.text.white : COLORS.text.gray}
          />
          <Text style={[styles.fuelName, selectedFuel === 'petrol' && styles.selectedFuelText]}>
            Petrol
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  fuelTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fuelOption: {
    width: '30%',
    height: 120,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  selectedFuelOption: {
    backgroundColor: COLORS.primary,
  },
  fuelName: {
    color: COLORS.text.gray,
    marginTop: 16,
    fontSize: 16,
  },
  selectedFuelText: {
    color: COLORS.text.white,
    fontWeight: 'bold',
  },
});
