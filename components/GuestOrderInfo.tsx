import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CustomIcon from './CustomIcon';
import { COLORS } from '../constants/colors';

interface GuestOrderInfoProps {
  visible: boolean;
}

/**
 * Component to inform guest users about how their orders are handled
 */
export default function GuestOrderInfo({ visible }: GuestOrderInfoProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <CustomIcon name="information-circle" size={20} color={COLORS.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Guest Order Information</Text>
        <Text style={styles.description}>
          Your order will be processed and the business will be notified immediately. 
          You'll receive confirmation via email or phone once your order is confirmed.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '20', // 20% opacity for better visibility
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.white,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: COLORS.text.lightGray,
    lineHeight: 18,
  },
});
