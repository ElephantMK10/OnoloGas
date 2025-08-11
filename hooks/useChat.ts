import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FlatList } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessagesContext';
import type { Message } from '../services/interfaces/IMessageService';

interface UseChatOptions {
  autoMarkAsRead?: boolean;
  enableConversationDates?: boolean;
  scrollDelay?: number;
}

interface UseChatReturn {
  // State
  input: string;
  sending: boolean;
  isLiveChatVisible: boolean;
  activeConversationDate: string | null;
  
  // Computed data
  conversationDates: string[];
  currentChatMessages: Message[];
  
  // Refs
  flatListRef: React.RefObject<FlatList>;
  
  // Actions
  setInput: (input: string) => void;
  setSending: (sending: boolean) => void;
  setLiveChatVisible: (visible: boolean) => void;
  setActiveConversationDate: (date: string | null) => void;
  handleSendMessage: () => Promise<void>;
  startNewChat: () => void;
  scrollToBottom: (animated?: boolean) => void;
  
  // Message context data
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  markAllAsRead: () => Promise<void>;
  sendMessage: (request: any) => Promise<void>;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    autoMarkAsRead = true,
    enableConversationDates = true,
    scrollDelay = 300,
  } = options;
  
  // Auth and Messages context
  const { user } = useAuth();
  const {
    messages,
    unreadCount,
    isLoading,
    sendMessage,
    markAllAsRead,
  } = useMessages();
  
  // Local state
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isLiveChatVisible, setLiveChatVisible] = useState(false);
  const [activeConversationDate, setActiveConversationDate] = useState<string | null>(null);
  
  // Refs
  const flatListRef = useRef<FlatList>(null);
  
  // Auto-set conversation date when live chat opens
  useEffect(() => {
    if (isLiveChatVisible && !activeConversationDate && enableConversationDates) {
      const today = new Date().toISOString().split('T')[0];
      setActiveConversationDate(today);
    }
  }, [isLiveChatVisible, activeConversationDate, enableConversationDates]);
  
  // Auto-mark messages as read when live chat is visible
  useEffect(() => {
    if (isLiveChatVisible && unreadCount > 0 && autoMarkAsRead) {
      markAllAsRead();
    }
  }, [isLiveChatVisible, unreadCount, markAllAsRead, autoMarkAsRead]);
  
  // Generate conversation dates from messages
  const conversationDates = useMemo(() => {
    if (!enableConversationDates) return [];
    
    const dates = new Set<string>();
    messages.forEach((msg) => {
      try {
        if (msg.createdAt && !isNaN(new Date(msg.createdAt).getTime())) {
          dates.add(new Date(msg.createdAt).toISOString().split('T')[0]);
        }
      } catch (error) {
        console.warn('Invalid date in message:', error);
      }
    });
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [messages, enableConversationDates]);
  
  // Filter messages by active conversation date
  const currentChatMessages = useMemo(() => {
    if (!enableConversationDates) {
      // Return all messages with client keys
      return messages.map(msg => ({
        ...msg,
        _clientKey: msg.id + '-' + (msg._clientKey || uuidv4().substring(0, 8))
      }));
    }
    
    if (!activeConversationDate) return [];
    
    return messages.filter((msg) => {
      try {
        if (!msg.createdAt || isNaN(new Date(msg.createdAt).getTime())) {
          return false;
        }
        return new Date(msg.createdAt).toISOString().split('T')[0] === activeConversationDate;
      } catch (error) {
        console.warn('Error filtering message by date:', error);
        return false;
      }
    }).map(msg => ({
      ...msg,
      _clientKey: msg.id + '-' + (msg._clientKey || uuidv4().substring(0, 8))
    }));
  }, [messages, activeConversationDate, enableConversationDates]);
  
  // Handle sending messages
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !user || sending) {
      console.log('SendMessage blocked: Input is empty, no user, or already sending.');
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
      
      // Scroll to bottom after a delay to ensure new message is rendered
      setTimeout(() => {
        scrollToBottom(true);
      }, scrollDelay);
      
    } catch (error: any) {
      console.error('Error sending message:', error.message);
      // Restore input on error
      setInput(messageContent);
    } finally {
      setSending(false);
    }
  }, [input, user, sending, sendMessage, scrollDelay]);
  
  // Start a new chat conversation
  const startNewChat = useCallback(() => {
    if (enableConversationDates) {
      const today = new Date().toISOString().split('T')[0];
      setActiveConversationDate(today);
    }
  }, [enableConversationDates]);
  
  // Scroll to bottom helper
  const scrollToBottom = useCallback((animated: boolean = true) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated });
    }
  }, []);
  
  return {
    // State
    input,
    sending,
    isLiveChatVisible,
    activeConversationDate,
    
    // Computed data
    conversationDates,
    currentChatMessages,
    
    // Refs
    flatListRef,
    
    // Actions
    setInput,
    setSending,
    setLiveChatVisible,
    setActiveConversationDate,
    handleSendMessage,
    startNewChat,
    scrollToBottom,
    
    // Message context data
    messages,
    unreadCount,
    isLoading,
    markAllAsRead,
    sendMessage,
  };
}
