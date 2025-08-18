import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { messageService } from '../services/messages/MessageService';
import { useAuth } from './AuthContext';
import type { Message, MessageFilters, CreateMessageRequest } from '../services/interfaces/IMessageService';

// Messages Context Types
interface MessagesContextType {
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  
  // Message methods
  sendMessage: (request: CreateMessageRequest) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  getMessagesByDate: (date: string) => Promise<Message[]>;
  deleteMessage: (messageId: string) => Promise<boolean>;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: React.ReactNode }) {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Auth context
  const { user, isAuthenticated } = useAuth();
  
  // Refs for cleanup
  const isMountedRef = useRef(true);
  const unsubscribeFuncsRef = useRef<Array<() => void>>([]);
  const messagesMapRef = useRef<Map<string, Message>>(new Map()); // For tracking duplicate messages

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up all subscriptions
      unsubscribeFuncsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFuncsRef.current = [];
    };
  }, []);

  // Load messages when user changes
  useEffect(() => {
    if (user && isAuthenticated) {
      loadMessages();
      loadUnreadCount();
      setupEventListeners();
    } else {
      // Clear messages when logged out
      setMessages([]);
      setUnreadCount(0);
      // Clean up subscriptions
      unsubscribeFuncsRef.current.forEach(unsubscribe => unsubscribe());
      unsubscribeFuncsRef.current = [];
    }
  }, [user, isAuthenticated]);

  // Load messages from service
  const loadMessages = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('MessagesContext: Loading messages for user:', user.id);
      
      const fetchedMessages = await messageService.getMessages(user.id, {
        limit: 50, // Load recent messages
      });
      
      if (isMountedRef.current) {
        // Update messages map for duplicate tracking
        messagesMapRef.current.clear();
        fetchedMessages.forEach(msg => {
          messagesMapRef.current.set(msg.id, {
            ...msg,
            _clientKey: msg.id + '-' + Date.now() // Ensure unique keys for rendering
          });
        });
        
        // Set state with messages from map to ensure unique objects
        setMessages(Array.from(messagesMapRef.current.values()));
        console.log(`MessagesContext: Loaded ${fetchedMessages.length} messages`);
      }
    } catch (error) {
      console.error('MessagesContext: Error loading messages:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Load unread count from service
  const loadUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      const count = await messageService.getUnreadCount(user.id);
      
      if (isMountedRef.current) {
        setUnreadCount(count);
        console.log(`MessagesContext: Unread count: ${count}`);
      }
    } catch (error) {
      console.error('MessagesContext: Error loading unread count:', error);
    }
  }, [user]);

  // Set up event listeners for real-time updates
  const setupEventListeners = useCallback(() => {
    if (!user) return;

    console.log('MessagesContext: Setting up real-time event listeners');

    // Set up real-time subscription for this user
    const unsubscribeRealtime = messageService.setupRealtimeSubscription(user.id);

    // Subscribe to new messages with optimized duplicate prevention
    const unsubscribeMessages = messageService.onMessageReceived((message) => {
      if (!isMountedRef.current) return;

      console.log('MessagesContext: New message received:', message.id);

      // Check map first for better performance
      if (messagesMapRef.current.has(message.id)) {
        console.log('MessagesContext: Duplicate message ignored:', message.id);
        return;
      }

      // Add to messages map with client key
      const enhancedMessage = {
        ...message,
        _clientKey: message.id + '-' + Date.now() // Ensure unique keys
      };
      messagesMapRef.current.set(message.id, enhancedMessage);

      setMessages(prev => [...prev, enhancedMessage]);

      // Update unread count if it's from staff and unread
      if (message.senderType === 'staff' && !message.isRead) {
        setUnreadCount(prev => prev + 1);
      }
    });

    // Subscribe to message updates with optimized processing
    const unsubscribeUpdates = messageService.onMessageUpdated((messageId, updates) => {
      if (!isMountedRef.current) return;

      console.log('MessagesContext: Message updated:', messageId, updates);

      // Check if message exists in map first
      const existingMsg = messagesMapRef.current.get(messageId);
      if (!existingMsg) {
        console.log('MessagesContext: Update for unknown message:', messageId);
        return;
      }

      // Update message in map first
      const updatedMessage = { ...existingMsg, ...updates };
      messagesMapRef.current.set(messageId, updatedMessage);

      // Update state with optimized check
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? updatedMessage
            : msg
        )
      );

      // Update unread count if needed
      if (updates.isRead !== undefined) {
        if (updates.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else if (existingMsg.senderType === 'staff' && !existingMsg.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    // Subscribe to unread count changes
    const unsubscribeUnreadCount = messageService.onUnreadCountChanged((newCount) => {
      if (isMountedRef.current) {
        setUnreadCount(newCount);
      }
    });

    // Clean up any existing subscriptions before adding new ones
    unsubscribeFuncsRef.current.forEach(unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('MessagesContext: Error cleaning up subscription:', error);
      }
    });

    // Store new unsubscribe functions
    unsubscribeFuncsRef.current = [
      unsubscribeRealtime,
      unsubscribeMessages,
      unsubscribeUpdates,
      unsubscribeUnreadCount,
    ];

    console.log('MessagesContext: Real-time event listeners set up successfully');
  }, [user, loadUnreadCount]);

  // Message methods
  const sendMessage = useCallback(async (request: CreateMessageRequest): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('MessagesContext: Sending message:', request);
      
      // Send message via service
      const newMessage = await messageService.sendMessage(request);
      
      console.log('MessagesContext: Message sent successfully', newMessage);
      
      // Update local state with the new message (real-time handler will also be triggered)
      setMessages(prev => {
        // Check if we already have this message to avoid duplicates
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        
        // Add client key to message
        const enhancedMessage = {
          ...newMessage,
          _clientKey: newMessage.id + '-' + Date.now()
        };
        
        // Update messages map
        messagesMapRef.current.set(newMessage.id, enhancedMessage);

        // Return new array with message added at end (newest messages at bottom)
        return [...prev, enhancedMessage];
      });
      
    } catch (error: any) {
      console.error('MessagesContext: Error sending message:', error.message);
      throw error;
    }
  }, [user]);

  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      console.log('MessagesContext: Marking message as read:', messageId);
      
      await messageService.markAsRead(messageId);
      
      console.log('MessagesContext: Message marked as read successfully');
      
      // Update local state (real-time handler will also be triggered)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true, _clientKey: msg._clientKey }
            : msg
        )
      );
      
      // Update message in map
      const existingMsg = messagesMapRef.current.get(messageId);
      if (existingMsg) {
        messagesMapRef.current.set(messageId, { ...existingMsg, isRead: true });
      }
      
      // Recalculate unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error: any) {
      console.error('MessagesContext: Error marking message as read:', error.message);
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (!user) return;

    try {
      console.log('MessagesContext: Marking all messages as read');
      
      await messageService.markAllAsRead(user.id);
      
      console.log('MessagesContext: All messages marked as read successfully');
      
      // Update local state (real-time handler will also be triggered)
      setMessages(prev => 
        prev.map(msg => ({ ...msg, isRead: true, _clientKey: msg._clientKey }))
      );
      
      // Update all messages in map
      messagesMapRef.current.forEach((msg, id) => {
        messagesMapRef.current.set(id, { ...msg, isRead: true });
      });
      
      // Reset unread count
      setUnreadCount(0);
      
    } catch (error: any) {
      console.error('MessagesContext: Error marking all messages as read:', error.message);
      throw error;
    }
  }, [user]);

  const refreshMessages = useCallback(async (): Promise<void> => {
    await loadMessages();
  }, [loadMessages]);

  const loadMoreMessages = useCallback(async (): Promise<void> => {
    // Implementation for pagination
    console.log('MessagesContext: Load more messages not implemented yet');
  }, []);

  const getMessagesByDate = useCallback(async (date: string): Promise<Message[]> => {
    if (!user) return [];

    try {
      const dateMessages = await messageService.getMessagesByDate(user.id, date);
      
      // Enhance messages with client keys
      const enhancedMessages = dateMessages.map(msg => ({
        ...msg,
        _clientKey: msg.id + '-' + Date.now()
      }));
      
      return enhancedMessages;
    } catch (error) {
      console.error('MessagesContext: Error getting messages by date:', error);
      return [];
    }
  }, [user]);

  const deleteMessage = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const success = await messageService.deleteMessage(messageId);
      
      if (success) {
        // Remove from local state
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        
        // Remove from map
        messagesMapRef.current.delete(messageId);
        
        console.log('MessagesContext: Message deleted successfully:', messageId);
      }
      
      return success;
    } catch (error) {
      console.error('MessagesContext: Error deleting message:', error);
      return false;
    }
  }, []);

  // Memoize the context value
  const value = useMemo(() => ({
    messages,
    unreadCount,
    isLoading,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refreshMessages,
    loadMoreMessages,
    getMessagesByDate,
    deleteMessage,
  }), [
    messages,
    unreadCount,
    isLoading,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refreshMessages,
    loadMoreMessages,
    getMessagesByDate,
    deleteMessage,
  ]);

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider');
  }
  return context;
}