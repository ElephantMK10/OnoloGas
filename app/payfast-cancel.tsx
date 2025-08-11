import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../constants/colors';
import Toast from 'react-native-toast-message';
import Button from '../components/Button';

export default function PayFastCancelScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('=== PayFast Cancel Screen ===');
    console.log('Received parameters:', params);

    // Show cancellation message based on the reason
    const reason = params.status || 'cancelled';
    
    let message = 'Your payment was cancelled.';
    let type: 'info' | 'error' = 'info';

    if (reason === 'error') {
      message = 'Payment failed due to an error.';
      type = 'error';
    } else if (reason === 'timeout') {
      message = 'Payment timed out. Please try again.';
      type = 'error';
    }

    Toast.show({
      type,
      text1: 'Payment Cancelled',
      text2: message + ' You can try again or choose a different payment method.',
      position: 'bottom',
      visibilityTime: 5000,
    });
  }, [params]);

  const handleReturnToCheckout = () => {
    router.replace('/checkout');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const handleTryDifferentPayment = () => {
    // Navigate back to checkout and suggest other payment methods
    router.replace('/checkout');
    setTimeout(() => {
      Toast.show({
        type: 'info',
        text1: 'Try Another Payment Method',
        text2: 'Consider using EFT or Cash on Delivery',
        position: 'bottom',
        visibilityTime: 4000,
      });
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.cancelIcon}>❌</Text>
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.subtitle}>
        Your PayFast payment was not completed. Don't worry, no charges were made to your account.
      </Text>

      {params.orderId && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Order ID:</Text>
          <Text style={styles.orderValue}>#{String(params.orderId).slice(-6)}</Text>
        </View>
      )}

      {__DEV__ && params.status && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugLabel}>Debug Info:</Text>
          <Text style={styles.debugText}>Cancellation Reason: {params.status}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button
          title="Try PayFast Again"
          onPress={handleReturnToCheckout}
          style={styles.button}
        />
        <Button
          title="Choose Different Payment"
          onPress={handleTryDifferentPayment}
          variant="outline"
          style={styles.button}
        />
        <Button
          title="Go Home"
          onPress={handleGoHome}
          variant="outline"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  cancelIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  orderInfo: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  orderLabel: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginRight: 8,
  },
  orderValue: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
  },
  debugLabel: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    color: COLORS.text.gray,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    marginBottom: 16,
  },
});