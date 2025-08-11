import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import Header from '../../components/Header';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../contexts/MessagesContext';
import { Ionicons } from '@expo/vector-icons';
import MessageBubble from '../../components/MessageBubble';
import { addRealtimeErrorListener, removeRealtimeErrorListener } from '../../services/realtime/RealtimeManager';
import TestDataGenerator from '../../components/TestDataGenerator';

export default function ChatScreen() {
  const { user } = useAuth();
  const { 
    messages, 
    sendMessage, 
    refreshMessages,
    markAllAsRead,
    unreadCount,
    isLoading,
  } = useMessages();
  
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [showRealtimeBanner, setShowRealtimeBanner] = useState(true);

  // Mark messages as read when screen is focused
  useEffect(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  }, [unreadCount, markAllAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      // Use a small delay to ensure the FlatList has rendered the new content
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    function handleRealtimeError(error: any) {
      setRealtimeError(error?.message || 'Chat features are currently unavailable.');
      setShowRealtimeBanner(true);
    }
    addRealtimeErrorListener(handleRealtimeError);
    return () => removeRealtimeErrorListener(handleRealtimeError);
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || !user || sending) {
      return;
    }

    setSending(true);
    const messageContent = input.trim();
    setInput('');

    try {
      if (!user.id) {
        throw new Error('User ID is required to send a message');
      }
      
      await sendMessage({
        userId: user.id,
        subject: messageContent,
        message: messageContent,
        logType: 'user_message',
        senderType: 'customer'
      });
      
      console.log('Message sent successfully');

      // Scroll to bottom after a short delay to ensure new message is rendered
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 300);
      
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      // Restore input on error
      setInput(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshMessages();
    } catch (error) {
      console.error('Error refreshing messages:', error);
    }
  };

  // Safely format timestamp
  const formatTimestamp = (dateStr: string) => {
    try {
      if (!dateStr || isNaN(new Date(dateStr).getTime())) {
        return '';
      }
      return new Date(dateStr).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
      return '';
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    // Safely format timestamp
    let timeString = '';
    try {
      if (item.createdAt && !isNaN(new Date(item.createdAt).getTime())) {
        timeString = new Date(item.createdAt).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (error) {
      console.warn('Error formatting message timestamp:', error);
      timeString = '';
    }

    return (
      <View
        style={[
          styles.messageBubble,
          item.senderType === 'customer' ? styles.userBubble : styles.staffBubble,
        ]}
      >
        {item.logType === 'order_status_update' && (
          <View style={styles.orderUpdateHeader}>
            <Ionicons name="cube-outline" size={16} color={COLORS.primary} />
            <Text style={styles.orderUpdateLabel}>Order Update</Text>
          </View>
        )}
        <Text style={styles.messageText}>{item.subject || item.message}</Text>
        <View style={styles.messageFooter}>
          <Text style={styles.timestamp}>{timeString}</Text>
          {!item.isRead && item.senderType === 'staff' && (
            <View style={styles.unreadDot} />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      {realtimeError && showRealtimeBanner && (
        <View style={styles.realtimeBanner}>
          <Ionicons name="warning-outline" size={18} color="#FFD700" style={{ marginRight: 8 }} />
          <Text style={styles.realtimeBannerText}>{realtimeError}</Text>
          <TouchableOpacity onPress={() => setShowRealtimeBanner(false)}>
            <Ionicons name="close" size={18} color="#FFD700" />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Performance Testing Tools */}
      <TestDataGenerator />

      {/* Pull to refresh header */}
      <View style={styles.refreshHeader}>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={16} color={COLORS.primary} />
          <Text style={styles.refreshText}>Pull to refresh</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={COLORS.text.gray} />
                <Text style={styles.emptyText}>
                  No messages yet. Send a message to start the conversation!
                </Text>
                <Text style={styles.emptySubtext}>
                  Our support team will respond as soon as possible.
                </Text>
              </View>
            }
            inverted={false}
            // Data is now sorted oldest first for proper chat flow
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onRefresh={handleRefresh}
            refreshing={false}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            initialNumToRender={15}
            windowSize={10}
            getItemLayout={(data, index) => ({
              length: 80, // Estimated height of MessageBubble
              offset: 80 * index,
              index,
            })}
          />
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.text.gray}
            editable={!sending}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSendMessage}
            showSoftInputOnFocus={true}
            keyboardType="default"
          />
          <TouchableOpacity
            style={[styles.sendButton, sending && { opacity: 0.5 }]}
            onPress={handleSendMessage}
            disabled={sending || !input.trim()}
          >
            <Ionicons 
              name={sending ? "hourglass" : "send"} 
              size={20} 
              color={COLORS.text.white} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex1: {
    flex: 1,
  },
  refreshHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  refreshText: {
    color: COLORS.primary,
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text.gray,
    marginTop: 12,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: COLORS.text.gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    color: COLORS.text.gray,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
  messageBubble: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  staffBubble: {
    backgroundColor: '#222',
    alignSelf: 'flex-start',
  },
  orderUpdateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderUpdateLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: COLORS.background,
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: COLORS.text.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  realtimeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    borderRadius: 8,
    padding: 10,
    margin: 12,
  },
  realtimeBannerText: {
    color: COLORS.text.white,
    fontSize: 14,
    flex: 1,
  },
});