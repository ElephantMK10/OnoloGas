import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface OrderStatusTrackerProps {
  status: 'pending' | 'order_received' | 'order_confirmed' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  orderDate: string;
  estimatedDelivery?: string;
}

const STATUS_STEPS = [
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    icon: 'checkmark-circle',
  },
  {
    key: 'preparing',
    label: 'Preparing Order',
    icon: 'construct',
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    icon: 'car',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: 'checkmark-done-circle',
  },
];

export default function OrderStatusTracker({
  status,
  orderDate,
  estimatedDelivery,
}: OrderStatusTrackerProps) {


  const getStatusIndex = (currentStatus: string) => {
    if (currentStatus === 'cancelled') return -1;
    if (currentStatus === 'pending') return -1;

    // Map database status values to component status values
    const statusMapping: { [key: string]: string } = {
      'order_received': 'confirmed',
      'order_confirmed': 'confirmed',
      'confirmed': 'confirmed',
      'preparing': 'preparing',
      'out_for_delivery': 'out_for_delivery',
      'delivered': 'delivered',
    };

    const mappedStatus = statusMapping[currentStatus] || currentStatus;
    return STATUS_STEPS.findIndex((step) => step.key === mappedStatus);
  };

  const currentStatusIndex = getStatusIndex(status);

  const getStatusColor = (stepIndex: number) => {
    if (status === 'cancelled') return COLORS.error;
    if (stepIndex <= currentStatusIndex) return COLORS.primary;
    return COLORS.text.gray;
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'pending':
        return 'Your order has been received and is being processed.';
      case 'order_received':
      case 'order_confirmed':
      case 'confirmed':
        return 'Your order has been confirmed and is being prepared.';
      case 'preparing':
        return 'Your order is being prepared for delivery.';
      case 'out_for_delivery':
        return 'Your order is on its way to you!';
      case 'delivered':
        return 'Your order has been successfully delivered.';
      case 'cancelled':
        return 'Your order has been cancelled.';
      default:
        return 'Order status unknown.';
    }
  };

  if (status === 'cancelled') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Order Status</Text>
        <View style={styles.cancelledContainer}>
          <Ionicons name="close-circle" size={48} color={COLORS.error} />
          <Text style={styles.cancelledText}>Order Cancelled</Text>
          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Status</Text>

      <View style={styles.statusHeader}>
        <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
        {estimatedDelivery && status !== 'delivered' && (
          <Text style={styles.estimatedDelivery}>Estimated delivery: {estimatedDelivery}</Text>
        )}
      </View>

      <View style={styles.timelineContainer}>
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index <= currentStatusIndex;
          const isActive = index === currentStatusIndex;

          return (
            <View key={step.key} style={styles.timelineStep}>
              <View style={styles.timelineRow}>
                <View style={[styles.stepIcon, { backgroundColor: getStatusColor(index) }]}>
                  <Ionicons name={step.icon as any} size={16} color={COLORS.text.white} />
                </View>

                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepLabel,
                      isActive && styles.activeStepLabel,
                      isCompleted && styles.completedStepLabel,
                    ]}
                  >
                    {step.label}
                  </Text>

                  {isActive && <Text style={styles.activeStepSubtext}>In Progress</Text>}

                  {isCompleted && index < currentStatusIndex && (
                    <Text style={styles.completedStepSubtext}>Completed</Text>
                  )}
                </View>
              </View>

              {index < STATUS_STEPS.length - 1 && (
                <View
                  style={[styles.timelineLine, { backgroundColor: getStatusColor(index + 1) }]}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  title: {
    color: COLORS.text.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statusHeader: {
    marginBottom: 20,
  },
  statusMessage: {
    color: COLORS.text.white,
    fontSize: 16,
    marginBottom: 8,
  },
  estimatedDelivery: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelledContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  cancelledText: {
    color: COLORS.error,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineStep: {
    position: 'relative',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    color: COLORS.text.gray,
    fontSize: 14,
  },
  activeStepLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  completedStepLabel: {
    color: COLORS.text.white,
  },
  activeStepSubtext: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 2,
  },
  completedStepSubtext: {
    color: COLORS.text.gray,
    fontSize: 12,
    marginTop: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 15,
    top: 32,
    width: 2,
    height: 16,
  },
});
