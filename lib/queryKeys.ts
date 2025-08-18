/**
 * Canonical query keys for React Query
 * Single source of truth for all cache keys
 */

import type { QueryClient, QueryKey as ReactQueryKey } from '@tanstack/react-query';

export const queryKeys = {
  // Authentication and user data
  auth: {
    user: ['auth', 'user'] as const,
    session: ['auth', 'session'] as const,
    status: ['auth', 'status'] as const,
  },
  
  // User profile data
  profile: {
    detail: (userId: string) => ['user', userId, 'profile'] as const,
    all: ['profile'] as const,
  },
  
  // Orders
  orders: {
    all: ['orders'] as const,
    byUser: (userId: string) => ['orders', 'user', userId] as const,
    detail: (orderId: string) => ['orders', 'detail', orderId] as const,
    stats: (userId: string) => ['orders', 'stats', userId] as const,
  },
  
  // Messages
  messages: {
    all: ['messages'] as const,
    byUser: (userId: string) => ['messages', 'user', userId] as const,
    unreadCount: (userId: string) => ['messages', 'unread', userId] as const,
    conversation: (userId: string) => ['messages', 'conversation', userId] as const,
    byDate: (userId: string, date: string) => ['messages', 'user', userId, 'date', date] as const,
  },
  
  // Notifications
  notifications: {
    settings: (userId: string) => ['notifications', 'settings', userId] as const,
    preferences: (userId: string) => ['notifications', 'preferences', userId] as const,
    history: (userId: string) => ['notifications', 'history', userId] as const,
  },
} as const;

/**
 * Type-safe query key factory helpers
 */
export type QueryKey = typeof queryKeys;

/**
 * Utility to get all user-scoped query keys for cache cleanup
 */
export const getUserScopedKeys = (userId: string) => [
  queryKeys.profile.detail(userId),
  queryKeys.orders.byUser(userId),
  queryKeys.orders.stats(userId),
  queryKeys.messages.byUser(userId),
  queryKeys.messages.unreadCount(userId),
  queryKeys.messages.conversation(userId),
  queryKeys.notifications.settings(userId),
  queryKeys.notifications.preferences(userId),
  queryKeys.notifications.history(userId),
] as const;

/**
 * Clear all user-scoped cache data using predicate for flexibility
 */
export function clearUserScopedCache(queryClient: QueryClient, userId: string) {
  queryClient.removeQueries({
    predicate: (query) => {
      const key = query.queryKey as ReactQueryKey;
      // Clear any keys that start with ['user', userId, ...] or auth*
      return (
        (Array.isArray(key) && key[0] === 'user' && key[1] === userId) ||
        (Array.isArray(key) && key[0] === 'auth') ||
        (Array.isArray(key) && key[0] === 'orders' && key[1] === 'user' && key[2] === userId) ||
        (Array.isArray(key) && key[0] === 'messages' && key[1] === 'user' && key[2] === userId) ||
        (Array.isArray(key) && key[0] === 'notifications' && key.includes(userId))
      );
    },
  });
}
