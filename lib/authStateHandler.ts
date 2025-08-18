/**
 * Auth state handler for corruption remediation and lifecycle management
 */

import React from 'react';
import { supabase, log } from './supabase';
import { clearUserScopedCache } from './queryKeys';

/**
 * Handle corrupted authentication state
 * Clears local state, caches, and redirects to sign-in
 */
export async function handleCorruptedAuth(
  queryClient: any,
  navigate: (path: string) => void,
  userId?: string
) {
  try {
    log.warn('Handling corrupted authentication state');
    
    // Clear local auth state
    await supabase.auth.signOut({ scope: 'local' }).catch((error) => {
      log.error('Failed to clear local auth state:', error);
    });
    
    // Clear user-scoped caches if userId is available
    if (userId) {
      clearUserScopedCache(queryClient, userId);
    } else {
      // Clear all auth-related caches if userId is unknown
      queryClient.clear();
    }
    
    // Navigate to sign-in screen
    navigate('/auth/login');
    
    log.info('Corrupted auth state cleared, redirected to sign-in');
  } catch (error) {
    log.error('Error handling corrupted auth state:', error);
    // Still navigate to sign-in even if cleanup fails
    navigate('/auth/login');
  }
}

/**
 * Auth state change handler
 * Manages cache invalidation and cleanup on auth events
 */
export function createAuthStateHandler(
  queryClient: any,
  navigate: (path: string) => void
) {
  let authStateSubscription: any = null;
  
  const startListening = () => {
    // Ensure only one listener is registered
    if (authStateSubscription) {
      authStateSubscription.unsubscribe();
    }
    
    authStateSubscription = supabase.auth.onAuthStateChange((event, session) => {
      log.debug(`Auth state changed: ${event}`, { 
        hasSession: !!session,
        userId: session?.user?.id 
      });
      
      switch (event) {
        case 'SIGNED_IN':
          // Invalidate and refetch user data
          queryClient.invalidateQueries({ queryKey: ['auth'] });
          queryClient.invalidateQueries({ queryKey: ['user'] });
          break;
          
        case 'SIGNED_OUT':
          // Clear all user-scoped caches
          const currentUser = queryClient.getQueryData(['auth', 'user']);
          const userId = currentUser?.id;
          
          if (userId) {
            clearUserScopedCache(queryClient, userId);
          } else {
            // Clear everything if we can't identify the user
            queryClient.clear();
          }
          
          // Navigate to welcome or login page
          navigate('/welcome');
          break;
          
        case 'TOKEN_REFRESHED':
          // Session was refreshed successfully, no action needed
          log.debug('Token refreshed successfully');
          break;
          
        case 'USER_UPDATED':
          // Invalidate user data to refetch latest
          queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
          break;
      }
    });
    
    return authStateSubscription;
  };
  
  const stopListening = () => {
    if (authStateSubscription) {
      authStateSubscription.unsubscribe();
      authStateSubscription = null;
    }
  };
  
  return {
    startListening,
    stopListening,
  };
}

/**
 * React hook for auth state management
 * Handles lifecycle and cleanup automatically
 */
export function useAuthStateHandler(
  queryClient: any,
  navigate: (path: string) => void
) {
  const handlerRef = React.useRef<ReturnType<typeof createAuthStateHandler> | null>(null);
  
  React.useEffect(() => {
    // Create handler if it doesn't exist
    if (!handlerRef.current) {
      handlerRef.current = createAuthStateHandler(queryClient, navigate);
    }
    
    // Start listening
    const subscription = handlerRef.current.startListening();
    
    // Cleanup on unmount
    return () => {
      if (handlerRef.current) {
        handlerRef.current.stopListening();
      }
    };
  }, [queryClient, navigate]);
  
  return {
    handleCorruptedAuth: (userId?: string) => 
      handleCorruptedAuth(queryClient, navigate, userId),
  };
}
