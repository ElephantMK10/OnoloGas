import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { useOrders } from '../../contexts/OrdersContext';
import { useOrder } from '../../hooks/queries/useOrderQueries';
import Header from '../../components/Header';
import OrderStatusTracker from '../../components/OrderStatusTracker';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Toast from 'react-native-toast-message';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cancelOrder } = useOrders();

  // Use fresh data from database instead of cached context data
  const { data: order, isLoading, error } = useOrder(id);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading order details...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <View style={styles.content}>
          <View style={styles.notFoundContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
            <Text style={styles.notFoundTitle}>Error Loading Order</Text>
            <Text style={styles.notFoundText}>
              There was an error loading the order details. Please try again.
            </Text>
            <Button title="Go Back" onPress={() => router.back()} style={styles.goBackButton} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Order not found state
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Header showBackButton />
        <View style={styles.content}>
          <View style={styles.notFoundContainer}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.text.gray} />
            <Text style={styles.notFoundTitle}>Order Not Found</Text>
            <Text style={styles.notFoundText}>
              The order you're looking for doesn't exist or has been removed.
            </Text>
            <Button title="Go Back" onPress={() => router.back()} style={styles.goBackButton} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleCancelOrder = () => {
    if (order.status !== 'pending') {
      Toast.show({
        type: 'error',
        text1: 'Cannot Cancel',
        text2: 'This order cannot be cancelled as it is already being processed.',
        position: 'bottom',
      });
      return;
    }

    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const success = await cancelOrder(order.id);
            if (success) {
              Toast.show({
                type: 'success',
                text1: 'Order Cancelled',
                text2: 'Your order has been cancelled successfully.',
                position: 'bottom',
              });
              router.back();
            } else {
              Toast.show({
                type: 'error',
                text1: 'Cancellation Failed',
                text2: 'Failed to cancel your order. Please try again.',
                position: 'bottom',
              });
            }
          },
        },
      ],
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'order_received':
      case 'order_confirmed':
      case 'confirmed':
      case 'preparing':
      case 'out_for_delivery':
        return COLORS.primary;
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return COLORS.error;
      default:
        return COLORS.text.gray;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'order_received':
        return 'Order Received';
      case 'order_confirmed':
      case 'confirmed':
        return 'Confirmed';
      case 'preparing':
        return 'Preparing';
      case 'out_for_delivery':
        return 'Out for Delivery';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header showBackButton />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Order Details</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}
          >
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusText(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order ID</Text>
            <Text style={styles.infoValue}>#{order.id.slice(-6)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Date</Text>
            <Text style={styles.infoValue}>{formatDate(order.date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{order.paymentMethod.toUpperCase()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery Address</Text>
            <Text style={styles.infoValue}>{order.deliveryAddress}</Text>
          </View>
        </View>

        <OrderStatusTracker
          status={order.status as any}
          orderDate={order.date}
          estimatedDelivery="1-2 working days"
        />

        <View style={styles.itemsCard}>
          <Text style={styles.cardTitle}>Order Items</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>R {(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>R {order.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {order.status === 'pending' && (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Order Actions</Text>
            <Button
              title="Cancel Order"
              onPress={handleCancelOrder}
              style={styles.cancelButton}
              variant="outline"
            />
          </View>
        )}

        <View style={styles.supportCard}>
          <Text style={styles.cardTitle}>Need Help?</Text>
          <Text style={styles.supportText}>
            If you have any questions about your order, please contact our customer support.
          </Text>

          <View style={styles.supportButtons}>
            <TouchableOpacity style={styles.supportButton}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              <Text style={styles.supportButtonText}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => router.push('/(tabs)/chat')}
            >
              <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
              <Text style={styles.supportButtonText}>Live Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text.white,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    color: COLORS.text.gray,
    fontSize: 14,
  },
  infoValue: {
    color: COLORS.text.white,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  itemsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: COLORS.text.white,
    fontSize: 14,
    marginBottom: 4,
  },
  itemQuantity: {
    color: COLORS.text.gray,
    fontSize: 12,
  },
  itemPrice: {
    color: COLORS.text.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cancelButton: {
    borderColor: COLORS.error,
  },
  supportCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 40,
  },
  supportText: {
    color: COLORS.text.gray,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  supportButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  supportButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notFoundTitle: {
    color: COLORS.text.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  notFoundText: {
    color: COLORS.text.gray,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  goBackButton: {
    width: '80%',
  },
});