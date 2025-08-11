import 'react-native-get-random-values';
import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import Header from '../../components/Header';
import { WebView } from 'react-native-webview';
import MessageBubble from '../../components/MessageBubble';
import { useChat } from '../../hooks/useChat';
import { Ionicons } from '@expo/vector-icons';

// ChatScreen: Main chat UI for live staff and AI assistant
// - Fetches chat history for the user
// - Subscribes to real-time updates from Supabase
// - Groups messages by date for conversation history
// - Allows starting a new chat (adds a system message)
export default function ChatScreen() {
  const chatbaseUrl = 'https://www.chatbase.co/chatbot-iframe/SzxvYORICrmmckhOCkvB6';

  // Use shared chat logic hook
  const {
    input,
    sending,
    isLiveChatVisible,
    activeConversationDate,
    conversationDates,
    currentChatMessages,
    flatListRef,
    setInput,
    setLiveChatVisible,
    setActiveConversationDate,
    handleSendMessage,
    startNewChat,
    unreadCount,
    isLoading,
  } = useChat({
    autoMarkAsRead: true,
    enableConversationDates: true,
    scrollDelay: 300,
  });



  // Safely format a date string, handling potential invalid dates
  const formatThreadDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header />
      <WebView source={{ uri: chatbaseUrl }} style={styles.webview} />
      <View style={styles.liveChatButtonContainer}>
        <TouchableOpacity style={styles.liveChatButton} onPress={() => setLiveChatVisible(true)}>
          <Text style={styles.liveChatButtonText}>Live Chat with Staff</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={isLiveChatVisible}
        animationType="slide"
        onRequestClose={() => setLiveChatVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Live Chat</Text>
            <TouchableOpacity onPress={() => setLiveChatVisible(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          {conversationDates.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Conversations:</Text>
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
              />
            </View>
          )}

          <TouchableOpacity style={styles.newChatButton} onPress={startNewChat}>
            <Text style={styles.newChatButtonText}>Start New Chat</Text>
          </TouchableOpacity>

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading messages...</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={currentChatMessages}
                keyExtractor={(item) => item._clientKey || item.id}
                contentContainerStyle={{ flexGrow: 1, padding: 16 }}
                renderItem={({ item }) => <MessageBubble message={item} />}
                ListEmptyComponent={
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>
                      Send a message to start the conversation with our support team.
                    </Text>
                  </View>
                }
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
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  webview: { flex: 1, backgroundColor: 'transparent' },
  liveChatButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
    paddingBottom: 34,
    backgroundColor: COLORS.background,
  },
  liveChatButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  liveChatButtonText: { color: COLORS.text.white, fontSize: 16, fontWeight: 'bold' },
  unreadBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: COLORS.text.white,
    fontSize: 12,
    fontWeight: 'bold',
  },

  modalContainer: { flex: 1, backgroundColor: COLORS.background, paddingTop: 50 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: { color: COLORS.text.white, fontSize: 18, fontWeight: 'bold' },
  closeButton: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },

  historyContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  historyTitle: { color: COLORS.text.gray, fontSize: 12, marginBottom: 8 },
  threadButton: {
    backgroundColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  activeThreadButton: { backgroundColor: COLORS.primary },
  threadButtonText: { color: COLORS.text.white, fontSize: 12 },

  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  loadingText: {
    color: COLORS.text.gray,
    marginTop: 12,
  },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: COLORS.text.gray, fontSize: 16, textAlign: 'center' },

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

  newChatButton: {
    alignSelf: 'center',
    backgroundColor: '#222',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 8,
  },
  newChatButtonText: { color: COLORS.text.white, fontSize: 14, fontWeight: 'bold' },
});