import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import type { Message } from '../services/interfaces/IMessageService';

interface MessageBubbleProps {
  message: Message & { _clientKey?: string };
}

const MessageBubble = memo<MessageBubbleProps>(({ message }) => {
  // Handle potential invalid dates
  const formattedTime = (() => {
    try {
      if (message.createdAt && !isNaN(new Date(message.createdAt).getTime())) {
        return new Date(message.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
      return '';
    } catch (error) {
      console.warn('Invalid date format:', error);
      return '';
    }
  })();

  const isFromUser = message.senderType === 'customer';
  const isOrderUpdate = message.logType === 'order_status_update';

  if (isOrderUpdate) {
    return (
      <View style={styles.orderUpdateContainer}>
        <View style={styles.orderUpdateBubble}>
          <Text style={styles.orderUpdateTitle}>📦 Order Update</Text>
          <Text style={styles.orderUpdateText}>{message.subject}</Text>
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>{formattedTime}</Text>
            {!message.isRead && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageBubble,
        isFromUser ? styles.userBubble : styles.staffBubble,
      ]}
    >
      <Text style={styles.messageText}>{message.subject || message.message}</Text>
      <View style={styles.messageFooter}>
        <Text style={styles.timestamp}>{formattedTime}</Text>
        {!message.isRead && !isFromUser && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;

const styles = StyleSheet.create({
  messageBubble: { 
    marginBottom: 12, 
    padding: 12, 
    borderRadius: 16, 
    maxWidth: '80%' 
  },
  userBubble: { 
    backgroundColor: COLORS.primary, 
    alignSelf: 'flex-end' 
  },
  staffBubble: { 
    backgroundColor: '#222', 
    alignSelf: 'flex-start' 
  },
  messageText: { 
    color: COLORS.text.white, 
    fontSize: 16,
    lineHeight: 22,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: { 
    color: COLORS.text.gray, 
    fontSize: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  orderUpdateContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  orderUpdateBubble: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    maxWidth: '90%',
  },
  orderUpdateTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderUpdateText: {
    color: COLORS.text.white,
    fontSize: 14,
    lineHeight: 20,
  },
});