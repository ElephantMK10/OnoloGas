import { useState, useCallback, useRef } from 'react';
import { messageService } from '../services/messages/MessageService';
import type { Message, MessageFilters } from '../services/interfaces/IMessageService';

interface UseMessagePaginationOptions {
  userId: string;
  initialLimit?: number;
  pageSize?: number;
}

interface UseMessagePaginationReturn {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  
  // Actions
  loadInitialMessages: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  clearMessages: () => void;
  refreshMessages: () => Promise<void>;
}

export function useMessagePagination({
  userId,
  initialLimit = 50,
  pageSize = 25,
}: UseMessagePaginationOptions): UseMessagePaginationReturn {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for tracking
  const messagesMapRef = useRef<Map<string, Message>>(new Map());
  const isMountedRef = useRef(true);
  
  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (!userId || isLoading) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('useMessagePagination: Loading initial messages for user:', userId);
      
      const fetchedMessages = await messageService.getMessages(userId, {
        limit: initialLimit,
      });
      
      if (isMountedRef.current) {
        // Clear and rebuild messages map
        messagesMapRef.current.clear();
        fetchedMessages.forEach(msg => {
          messagesMapRef.current.set(msg.id, {
            ...msg,
            _clientKey: msg.id + '-' + Date.now()
          });
        });
        
        // Set messages from map
        setMessages(Array.from(messagesMapRef.current.values()));
        setHasMore(fetchedMessages.length === initialLimit);
        
        console.log(`useMessagePagination: Loaded ${fetchedMessages.length} initial messages`);
      }
    } catch (err: any) {
      console.error('useMessagePagination: Error loading initial messages:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load messages');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, initialLimit, isLoading]);
  
  // Load more messages for pagination
  const loadMoreMessages = useCallback(async () => {
    if (!userId || isLoading || !hasMore) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('useMessagePagination: Loading more messages for user:', userId);
      
      const currentCount = messagesMapRef.current.size;
      const fetchedMessages = await messageService.getMessages(userId, {
        limit: pageSize,
        offset: currentCount,
      });
      
      if (isMountedRef.current) {
        if (fetchedMessages.length > 0) {
          // Add new messages to map
          fetchedMessages.forEach(msg => {
            if (!messagesMapRef.current.has(msg.id)) {
              messagesMapRef.current.set(msg.id, {
                ...msg,
                _clientKey: msg.id + '-' + Date.now()
              });
            }
          });
          
          // Update messages state with all messages from map
          const allMessages = Array.from(messagesMapRef.current.values())
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          
          setMessages(allMessages);
          setHasMore(fetchedMessages.length === pageSize);
          
          console.log(`useMessagePagination: Loaded ${fetchedMessages.length} more messages`);
        } else {
          setHasMore(false);
          console.log('useMessagePagination: No more messages to load');
        }
      }
    } catch (err: any) {
      console.error('useMessagePagination: Error loading more messages:', err);
      if (isMountedRef.current) {
        setError(err.message || 'Failed to load more messages');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, pageSize, isLoading, hasMore]);
  
  // Add a new message
  const addMessage = useCallback((message: Message) => {
    if (messagesMapRef.current.has(message.id)) {
      console.log('useMessagePagination: Duplicate message ignored:', message.id);
      return;
    }
    
    const enhancedMessage = {
      ...message,
      _clientKey: message.id + '-' + Date.now()
    };
    
    messagesMapRef.current.set(message.id, enhancedMessage);
    setMessages(prev => [enhancedMessage, ...prev]);
    
    console.log('useMessagePagination: Message added:', message.id);
  }, []);
  
  // Update an existing message
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    const existingMsg = messagesMapRef.current.get(messageId);
    if (!existingMsg) {
      console.log('useMessagePagination: Update for unknown message:', messageId);
      return;
    }
    
    const updatedMessage = { ...existingMsg, ...updates };
    messagesMapRef.current.set(messageId, updatedMessage);
    
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId ? updatedMessage : msg
      )
    );
    
    console.log('useMessagePagination: Message updated:', messageId);
  }, []);
  
  // Remove a message
  const removeMessage = useCallback((messageId: string) => {
    messagesMapRef.current.delete(messageId);
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    console.log('useMessagePagination: Message removed:', messageId);
  }, []);
  
  // Clear all messages
  const clearMessages = useCallback(() => {
    messagesMapRef.current.clear();
    setMessages([]);
    setHasMore(true);
    setError(null);
    
    console.log('useMessagePagination: Messages cleared');
  }, []);
  
  // Refresh messages (reload from beginning)
  const refreshMessages = useCallback(async () => {
    clearMessages();
    await loadInitialMessages();
  }, [clearMessages, loadInitialMessages]);
  
  return {
    messages,
    isLoading,
    hasMore,
    error,
    
    // Actions
    loadInitialMessages,
    loadMoreMessages,
    addMessage,
    updateMessage,
    removeMessage,
    clearMessages,
    refreshMessages,
  };
}
