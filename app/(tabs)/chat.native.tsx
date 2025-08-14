import 'react-native-get-random-values';
import React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import Header from '../../components/Header';
import MessageBubble from '../../components/MessageBubble';
import { useChat } from '../../hooks/useChat';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const {
    input,
    sending,
    activeConversationDate,
    conversationDates,
    currentChatMessages,
    flatListRef,
    setInput,
    setActiveConversationDate,
    handleSendMessage: originalHandleSendMessage,
    startNewChat: originalStartNewChat,
    isLoading,
  } = useChat({
    autoMarkAsRead: true,
    enableConversationDates: true,
    scrollDelay: 300,
  });

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await originalHandleSendMessage(input.trim());
      setActiveConversationDate(today);
      setInput('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const startNewChat = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      setActiveConversationDate(today);
      await originalStartNewChat();
    } catch (error) {
      console.error('Failed to start new chat:', error);
    }
  };

  const formatThreadDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header />
      <View style={styles.chatHeader}>
        <Text style={styles.chatTitle}>Support Chat</Text>
        {conversationDates.length > 0 && (
          <FlatList
            horizontal
            data={conversationDates}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.threadButton,
                  item === activeConversationDate && styles.activeThreadButton,
                ]}
                onPress={() => setActiveConversationDate(item)}
              >
                <Text style={styles.threadButtonText}>{formatThreadDate(item)}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
            style={styles.threadList}
          />
        )}
        <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
          <Ionicons name="add-circle-outline" size={20} color={COLORS.text.white} />
          <Text style={styles.newChatButtonText}>New Chat</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={currentChatMessages}
            keyExtractor={(item) => item._clientKey || item.id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ListEmptyComponent={
              <View style={styles.placeholder}>
                <Ionicons name="chatbubbles-outline" size={48} color={COLORS.text.gray} />
                <Text style={styles.placeholderText}>
                  Start a conversation with our support team
                </Text>
              </View>
            }
          />
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.text.gray}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Ionicons name="send" size={20} color="white" />
            )}
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
  chatHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  threadList: {
    marginTop: 8,
  },
  threadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeThreadButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  threadButtonText: {
    color: COLORS.text.primary,
    fontSize: 12,
  },
  activeThreadButtonText: {
    color: 'white',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  newChatButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  messageList: {
    padding: 16,
    paddingBottom: 80,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    color: COLORS.text.white,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 8,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 121, 0, 0.3)',
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderText: {
    marginTop: 16,
    textAlign: 'center',
    color: COLORS.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});