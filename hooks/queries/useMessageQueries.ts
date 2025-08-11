import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService } from '../../services/messages/MessageService';
import { queryKeys, invalidateQueries } from '../../utils/queryClient';
import type { 
  CreateMessageRequest, 
  MessageFilters 
} from '../../services/interfaces/IMessageService';

// Messages list query
export const useMessages = (userId: string, filters?: MessageFilters) => {
  return useQuery({
    queryKey: queryKeys.messages.list(userId, filters),
    queryFn: () => messageService.getMessages(userId, filters),
    enabled: !!userId && userId !== 'guest', // Don't fetch for guest users
    staleTime: 30 * 1000, // 30 seconds - messages are real-time
    refetchInterval: 60 * 1000, // Refetch every minute as backup
  });
};

// Unread message count query
export const useUnreadCount = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.messages.unreadCount(userId),
    queryFn: () => messageService.getUnreadCount(userId),
    enabled: !!userId && userId !== 'guest',
    staleTime: 15 * 1000, // 15 seconds for unread count
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

// Messages by date query
export const useMessagesByDate = (userId: string, date: string) => {
  return useQuery({
    queryKey: queryKeys.messages.conversation(userId, date),
    queryFn: () => messageService.getMessagesByDate(userId, date),
    enabled: !!userId && userId !== 'guest' && !!date,
    staleTime: 2 * 60 * 1000, // 2 minutes for historical messages
  });
};

// Conversation summary query
export const useConversationSummary = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.messages.summary(userId),
    queryFn: () => messageService.getConversationSummary(userId),
    enabled: !!userId && userId !== 'guest',
    staleTime: 5 * 60 * 1000, // 5 minutes for summary
  });
};

// Send message mutation
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageData: CreateMessageRequest) => messageService.sendMessage(messageData),
    onSuccess: (newMessage, variables) => {
      console.log('Message sent successfully:', newMessage.id);
      
      // Invalidate messages queries
      invalidateQueries.messages(variables.userId);
      
      // Optimistically add message to cache
      queryClient.setQueryData(
        queryKeys.messages.list(variables.userId),
        (oldData: any) => {
          if (Array.isArray(oldData)) {
            return [newMessage, ...oldData];
          }
          return [newMessage];
        }
      );
      
      // Update unread count for other users (if this is from staff)
      if (variables.senderType === 'staff') {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.messages.unreadCount(variables.userId) 
        });
      }
      
      // Update conversation summary
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.messages.summary(variables.userId) 
      });
    },
    onError: (error) => {
      console.error('Send message mutation error:', error);
    },
  });
};

// Mark message as read mutation
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => messageService.markAsRead(messageId),
    onSuccess: (_, messageId) => {
      console.log('Message marked as read:', messageId);
      
      // Update message in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.messages.all },
        (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map(message => 
              message.id === messageId ? { ...message, isRead: true } : message
            );
          }
          return oldData;
        }
      );
      
      // Invalidate unread count
      queryClient.invalidateQueries({ 
        queryKey: ['messages', 'unreadCount'] 
      });
    },
    onError: (error) => {
      console.error('Mark as read mutation error:', error);
    },
  });
};

// Mark all messages as read mutation
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => messageService.markAllAsRead(userId),
    onSuccess: (_, userId) => {
      console.log('All messages marked as read for user:', userId);
      
      // Update all messages in cache
      queryClient.setQueriesData(
        { queryKey: queryKeys.messages.all },
        (oldData: any) => {
          if (Array.isArray(oldData)) {
            return oldData.map(message => ({ ...message, isRead: true }));
          }
          return oldData;
        }
      );
      
      // Reset unread count to 0
      queryClient.setQueryData(
        queryKeys.messages.unreadCount(userId),
        0
      );
    },
    onError: (error) => {
      console.error('Mark all as read mutation error:', error);
    },
  });
};

// Delete message mutation
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
    onSuccess: (success, messageId) => {
      if (success) {
        console.log('Message deleted successfully:', messageId);
        
        // Remove message from cache
        queryClient.setQueriesData(
          { queryKey: queryKeys.messages.all },
          (oldData: any) => {
            if (Array.isArray(oldData)) {
              return oldData.filter(message => message.id !== messageId);
            }
            return oldData;
          }
        );
        
        // Invalidate related queries
        invalidateQueries.messages();
      }
    },
    onError: (error) => {
      console.error('Delete message mutation error:', error);
    },
  });
};

// Combined messages hook for convenience
export const useMessagesData = (userId: string, filters?: MessageFilters) => {
  const messagesQuery = useMessages(userId, filters);
  const unreadCountQuery = useUnreadCount(userId);
  const summaryQuery = useConversationSummary(userId);
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteMessageMutation = useDeleteMessage();
  
  return {
    // Data
    messages: messagesQuery.data || [],
    unreadCount: unreadCountQuery.data || 0,
    summary: summaryQuery.data,
    
    // Loading states
    isLoading: messagesQuery.isLoading || unreadCountQuery.isLoading,
    isSending: sendMessageMutation.isPending,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    
    // Error states
    messagesError: messagesQuery.error,
    unreadCountError: unreadCountQuery.error,
    sendError: sendMessageMutation.error,
    
    // Actions
    sendMessage: sendMessageMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteMessage: deleteMessageMutation.mutateAsync,
    
    // Refetch functions
    refetchMessages: messagesQuery.refetch,
    refetchUnreadCount: unreadCountQuery.refetch,
    
    // Utility functions
    getMessagesByDate: (date: string) => {
      return messagesQuery.data?.filter(msg => 
        new Date(msg.createdAt).toDateString() === new Date(date).toDateString()
      ) || [];
    },
  };
};