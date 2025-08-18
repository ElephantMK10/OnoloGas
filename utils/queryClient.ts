import { QueryClient } from '@tanstack/react-query';

// Configure React Query client with optimal settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      
      // Cache time: Data stays in cache for 30 minutes after going stale
      gcTime: 30 * 60 * 1000,
      
      // Retry configuration
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch on window focus in production, but not in development
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      
      // Refetch on network reconnect
      refetchOnReconnect: true,
      
      // Background refetching
      refetchInterval: false, // Disable automatic background refetching
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      
      // Mutation retry delay
      retryDelay: 1000,
      
      // Mutation timeout
      networkMode: 'online',
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth queries
  auth: {
    user: ['auth', 'user'],
    session: ['auth', 'session'],
  },
  
  // Order queries
  orders: {
    all: ['orders'],
    list: (userId: string, filters?: any) => ['orders', 'list', userId, filters],
    detail: (orderId: string) => ['orders', 'detail', orderId],
    stats: (userId: string) => ['orders', 'stats', userId],
  },
  
  // Message queries
  messages: {
    all: ['messages'],
    list: (userId: string, filters?: any) => ['messages', 'list', userId, filters],
    unreadCount: (userId: string) => ['messages', 'unreadCount', userId],
    conversation: (userId: string, date: string) => ['messages', 'conversation', userId, date],
    summary: (userId: string) => ['messages', 'summary', userId],
  },
  
  // Notification queries
  notifications: {
    all: ['notifications'],
    settings: (userId: string) => ['notifications', 'settings', userId],
    preferences: (userId: string) => ['notifications', 'preferences', userId],
    history: (userId: string, limit?: number) => ['notifications', 'history', userId, limit],
  },
  
  // Profile queries
  profile: {
    detail: (userId: string) => ['profile', 'detail', userId],
    completion: (userId: string) => ['profile', 'completion', userId],
  },
} as const;

// Utility function to invalidate related queries
export const invalidateQueries = {
  // Invalidate all user-related data
  allUserData: (userId: string) => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  },
  
  // Invalidate orders
  orders: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.list(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.stats(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    }
  },
  
  // Invalidate profile
  profile: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.completion(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  },
  
  // Invalidate messages
  messages: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.list(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.unreadCount(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.summary(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    }
  },
  
  // Invalidate notifications
  notifications: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.settings(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.history(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    }
  },
};