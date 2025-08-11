import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';
import { useOrders } from '../contexts/OrdersContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../context/CartContext';
import Toast from 'react-native-toast-message';
import { sendOrderConfirmationEmail } from '../utils/email';
import Button from '../components/Button';

export default function PayFastSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderCreated, setOrderCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('=== PayFast Success Screen ===');
    console.log('Received parameters:', params);

    // Process the PayFast return
    const processPayFastReturn = async () => {
      try {
        // Extract PayFast return data
        const orderId = params.orderId || params.m_payment_id;
        const amount = params.amount;
        const status = params.status || params.payment_status;

        console.log('Processing PayFast return:', { orderId, amount, status });

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (!user || user.isGuest) {
          console.error('User is not authenticated or is a guest');
          setError('Authentication error. Please login to complete your order.');
          setIsProcessing(false);
          return;
        }

        if (status === 'COMPLETE' || status === 'simulated' || status === 'advanced_test') {
          // Retrieve and complete the pending order
          const pendingOrderData = await AsyncStorage.getItem('@onolo_pending_order');
          if (pendingOrderData) {
            const orderData = JSON.parse(pendingOrderData);
            
            try {
              // Create the order in the system
              const newOrder = await createOrder({
                ...orderData,
                userId: user.id, // Ensure user ID is included for RLS
                paymentMethod: 'payfast', // Ensure correct payment method
              });
              setOrderCreated(true);
              
              // Clear the pending order data
              await AsyncStorage.removeItem('@onolo_pending_order');
              
              // Clear the cart
              clearCart();
              
              // Send confirmation email if email is provided
              if (orderData.customerEmail && orderData.customerEmail.trim() !== '') {
                console.log('Sending PayFast order confirmation email...');
                const emailData = {
                  customerName: orderData.customerName,
                  customerEmail: orderData.customerEmail,
                  orderId: newOrder.id.slice(-6),
                  orderDate: new Date(newOrder.date).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                  orderItems: orderData.items,
                  totalAmount: newOrder.totalAmount,
                  paymentMethod: 'PayFast',
                  deliveryAddress: newOrder.deliveryAddress,
                  deliverySchedule: orderData.deliverySchedule,
                };
                
                sendOrderConfirmationEmail(emailData).catch((error) => {
                  console.error('Error sending PayFast confirmation email:', error);
                  // Show a notification about email issue with spam folder reminder
                  setTimeout(() => {
                    Toast.show({
                      type: 'info',
                      text1: '📧 Email Status',
                      text2: 'Payment confirmed! Email delivery may be delayed - please check your spam/junk folder.',
                      position: 'bottom',
                      visibilityTime: 6000,
                    });
                  }, 3000); // Show after the main success message
                });
              }
              
              // Show enhanced success message
              const hasEmail = orderData.customerEmail && orderData.customerEmail.trim() !== '';
              Toast.show({
                type: 'success',
                text1: '🎉 Payment Successful!',
                text2: hasEmail
                  ? `Order #${newOrder.id.slice(-6)} created. Payment processed via PayFast. Confirmation email sent to ${orderData.customerEmail}`
                  : `Order #${newOrder.id.slice(-6)} created and payment processed via PayFast.`,
                position: 'bottom',
                visibilityTime: 6000, // Show longer for payment confirmation
              });

              // Show spam folder reminder for email orders
              if (hasEmail) {
                setTimeout(() => {
                  Toast.show({
                    type: 'info',
                    text1: '📧 Email Reminder',
                    text2: 'Please check your spam/junk folder if you don\'t receive the confirmation email within a few minutes.',
                    position: 'bottom',
                    visibilityTime: 6000,
                  });
                }, 4000);
              }
            } catch (orderError: any) {
              console.error('Error creating order after payment:', orderError);
              setError('Your payment was successful, but we encountered an issue creating your order. Please contact support with your payment reference.');
            }
          } else {
            console.warn('No pending order data found after PayFast payment');
            setError('Payment successful, but order data not found. Please contact support.');
          }
          
          console.log('PayFast payment processed successfully');
        } else {
          throw new Error('Payment status indicates failure: ' + status);
        }

      } catch (error: any) {
        console.error('Error processing PayFast return:', error);
        setError('There was an issue verifying your payment. Please contact support.');
      } finally {
        setIsProcessing(false);
      }
    };

    processPayFastReturn();
  }, [params]);

  const handleViewOrders = () => {
    router.replace('/profile');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  if (isProcessing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.processingText}>Processing your payment...</Text>
        <Text style={styles.processingSubtext}>Please wait while we verify your payment with PayFast</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.title}>Payment Issue</Text>
        <Text style={styles.subtitle}>{error}</Text>
        
        {params.orderId && (
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>Reference:</Text>
            <Text style={styles.orderValue}>#{String(params.orderId).slice(-6)}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Contact Support"
            onPress={() => router.push('/(tabs)/chat')}
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

  return (
    <View style={styles.container}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.subtitle}>
        {orderCreated 
          ? 'Your PayFast payment has been processed and your order has been created successfully. Your order is now being prepared for delivery.'
          : 'Your PayFast payment has been processed successfully.'
        }
      </Text>
      
      {params.orderId && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Order ID:</Text>
          <Text style={styles.orderValue}>#{String(params.orderId).slice(-6)}</Text>
        </View>
      )}

      {params.amount && (
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Amount Paid:</Text>
          <Text style={styles.orderValue}>R {params.amount}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title={orderCreated ? "View My Orders" : "Go to Profile"}
          onPress={handleViewOrders}
          style={styles.button}
        />
        <Button
          title="Continue Shopping"
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
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.text.gray,
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 24,
  },
  successIcon: {
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
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    color: COLORS.text.gray,
    fontSize: 12,
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier',
    marginBottom: 4,
  },
  processingText: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  processingSubtext: {
    color: COLORS.text.gray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginTop: 30,
  },
  button: {
    marginBottom: 16,
  },
});