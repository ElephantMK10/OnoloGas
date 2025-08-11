import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/colors';

export interface AddressValidationResult {
  isValid: boolean;
  suggestions?: string[];
  formattedAddress?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country?: string;
}

interface AddressValidatorProps {
  address: string;
  onValidationComplete: (result: AddressValidationResult) => void;
  enabled?: boolean;
}

// South African postal codes validation
const validateSouthAfricanPostalCode = (postalCode: string): boolean => {
  // SA postal codes are 4 digits
  const saPostalCodeRegex = /^\d{4}$/;
  return saPostalCodeRegex.test(postalCode.trim());
};

// Basic address validation for South Africa
const validateAddress = async (address: string): Promise<AddressValidationResult> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const addressParts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (addressParts.length < 2) {
    return {
      isValid: false,
      suggestions: ['Please provide a complete address with street and city'],
    };
  }

  // Extract potential postal code
  const postalCodeMatch = address.match(/\b\d{4}\b/);
  const hasValidPostalCode = postalCodeMatch && validateSouthAfricanPostalCode(postalCodeMatch[0]);

  // Common SA cities for validation
  const saCities = [
    'johannesburg',
    'cape town',
    'durban',
    'pretoria',
    'port elizabeth',
    'bloemfontein',
    'east london',
    'pietermaritzburg',
    'witbank',
    'vanderbijlpark',
    'centurion',
    'sandton',
    'roodepoort',
    'benoni',
    'boksburg',
    'germiston',
    'randburg',
    'midrand',
    'kempton park',
    'springs',
    'alberton',
  ];

  const hasRecognizedCity = saCities.some((city) => address.toLowerCase().includes(city));

  // Basic validation checks
  const isValid =
    addressParts.length >= 2 &&
    addressParts[0].length > 5 && // Street address should be substantial
    (hasValidPostalCode || hasRecognizedCity);

  let suggestions: string[] = [];

  if (!isValid) {
    if (addressParts.length < 2) {
      suggestions.push('Please include both street address and city');
    }
    if (addressParts[0].length <= 5) {
      suggestions.push('Please provide a more complete street address');
    }
    if (!hasValidPostalCode && !hasRecognizedCity) {
      suggestions.push(
        'Please include a valid South African postal code (4 digits) or recognized city',
      );
    }
  }

  return {
    isValid,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    formattedAddress: isValid ? address : undefined,
    postalCode: postalCodeMatch ? postalCodeMatch[0] : undefined,
  };
};

export default function AddressValidator({
  address,
  onValidationComplete,
  enabled = true,
}: AddressValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<AddressValidationResult | null>(null);

  useEffect(() => {
    if (!enabled || !address.trim()) {
      setValidationResult(null);
      return;
    }

    const validateAddressWithDelay = async () => {
      setIsValidating(true);

      try {
        // Debounce validation
        await new Promise((resolve) => setTimeout(resolve, 500));

        const result = await validateAddress(address);
        setValidationResult(result);
        onValidationComplete(result);
      } catch (error) {
        console.error('Address validation error:', error);
        const fallbackResult: AddressValidationResult = {
          isValid: false,
          suggestions: ['Address validation service temporarily unavailable'],
        };
        setValidationResult(fallbackResult);
        onValidationComplete(fallbackResult);
      } finally {
        setIsValidating(false);
      }
    };

    validateAddressWithDelay();
  }, [address, enabled, onValidationComplete]);

  if (!enabled || !address.trim()) {
    return null;
  }

  return (
    <View style={styles.container}>
      {isValidating && (
        <View style={styles.validatingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.validatingText}>Validating address...</Text>
        </View>
      )}

      {!isValidating && validationResult && (
        <View style={styles.resultContainer}>
          {validationResult.isValid ? (
            <View style={styles.validContainer}>
              <Text style={styles.validText}>✅ Address validated</Text>
              {validationResult.formattedAddress && (
                <Text style={styles.formattedAddress}>{validationResult.formattedAddress}</Text>
              )}
            </View>
          ) : (
            <View style={styles.invalidContainer}>
              <Text style={styles.invalidText}>⚠️ Address needs review</Text>
              {validationResult.suggestions?.map((suggestion, index) => (
                <Text key={index} style={styles.suggestion}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  validatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 6,
  },
  validatingText: {
    color: COLORS.primary,
    fontSize: 12,
    marginLeft: 8,
  },
  resultContainer: {
    padding: 8,
    borderRadius: 6,
  },
  validContainer: {
    backgroundColor: '#10B98120',
  },
  validText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  formattedAddress: {
    color: '#10B981',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  invalidContainer: {
    backgroundColor: '#EF444420',
  },
  invalidText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  suggestion: {
    color: '#EF4444',
    fontSize: 11,
    marginLeft: 8,
  },
});
