import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth/AuthService';
import { queryKeys as utilQueryKeys, invalidateQueries } from '../../utils/queryClient';
import { simpleUpdateProfile } from '@/services/simpleProfileService';
import type { LoginRequest, RegisterRequest, User } from '../../services/interfaces/IAuthService';
import { supabase, log, isAuthError, ensureSession } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth as useAuthContext } from '../../contexts/AuthContext';

// Current user query
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => authService.getCurrentUser(),
    staleTime: 10 * 60 * 1000, // 10 minutes - user data doesn't change often
    retry: 1, // Don't retry auth failures aggressively
  });
};

// Authentication status query
export const useAuthStatus = () => {
  return useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (result) => {
      if (result.success && result.user) {
        // Update auth queries
        queryClient.setQueryData(queryKeys.auth.user, result.user);
        queryClient.setQueryData(queryKeys.auth.session, true);
        
        // Prefetch user data
        invalidateQueries.allUserData(result.user.id);
      }
    },
    onError: (error) => {
      console.error('Login mutation error:', error);
      // Clear auth data on error
      queryClient.setQueryData(queryKeys.auth.user, null);
      queryClient.setQueryData(queryKeys.auth.session, false);
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (result) => {
      if (result.success && result.user) {
        // Update auth queries
        queryClient.setQueryData(queryKeys.auth.user, result.user);
        queryClient.setQueryData(queryKeys.auth.session, true);
        
        // Prefetch user data
        invalidateQueries.allUserData(result.user.id);
      }
    },
    onError: (error) => {
      console.error('Register mutation error:', error);
    },
  });
};


// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // Clear all user data from cache
      queryClient.clear();
      
      // Reset auth state
      queryClient.setQueryData(queryKeys.auth.user, null);
      queryClient.setQueryData(queryKeys.auth.session, false);
    },
    onError: (error) => {
      console.error('Logout mutation error:', error);
      // Even if logout fails, clear local data
      queryClient.clear();
    },
  });
};

// Refresh token mutation
export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authService.refreshToken(),
    onSuccess: (success) => {
      if (success) {
        // Refresh current user data
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      } else {
        // Token refresh failed, user might need to login again
        queryClient.setQueryData(queryKeys.auth.user, null);
        queryClient.setQueryData(queryKeys.auth.session, false);
      }
    },
    onError: (error) => {
      console.error('Token refresh error:', error);
      // Clear auth data on refresh failure
      queryClient.setQueryData(queryKeys.auth.user, null);
      queryClient.setQueryData(queryKeys.auth.session, false);
    },
  });
};

// Combined auth hook for convenience
export const useAuth = () => {
  const userQuery = useCurrentUser();
  const authStatusQuery = useAuthStatus();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const refreshTokenMutation = useRefreshToken();
  
  return {
    // Data
    user: userQuery.data,
    isAuthenticated: authStatusQuery.data || false,
    isGuest: userQuery.data?.isGuest || false,
    
    // Loading states
    isLoading: userQuery.isLoading || authStatusQuery.isLoading,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    
    // Error states
    userError: userQuery.error,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
    
    // Actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshToken: refreshTokenMutation.mutateAsync,
    
    // Refetch functions
    refetchUser: userQuery.refetch,
    refetchAuthStatus: authStatusQuery.refetch,
  };
};
// Profile update mutation with proper typing
type ProfilePatch = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuthContext();

  return useMutation<any, Error, ProfilePatch>({
    mutationFn: async (profileData) => {
      const requestId = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      log.info(`[${requestId}] Profile update started`, { userId: profileData.id });
      console.log(`[${requestId}] Profile update mutation started`, { userId: profileData.id });

      try {
        console.log(`[${requestId}] Getting current session directly...`);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          throw new Error('No active session. Please sign in again.');
        }
        
        const userId = session.user.id;
        log.info(`[${requestId}] Using session user id: ${userId}`);
        console.log(`[${requestId}] Session verified, userId: ${userId}`);

        if (userId !== profileData.id) {
          throw new Error('User ID mismatch. Please sign in again.');
        }

        console.log(`[${requestId}] About to call simpleUpdateProfile with data:`, profileData);
        const result = await simpleUpdateProfile(profileData.id, {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          address: profileData.address
        });
        if (!result) throw new Error('No profile row updated');

        log.info(`[${requestId}] Profile update completed successfully`);
        console.log(`[${requestId}] Profile update mutation completed, result:`, result);
        return result;
      } catch (error: any) {
        log.error(`[${requestId}] Profile update failed:`, error);
        console.error(`[${requestId}] Profile update failed:`, error);
        if (isAuthError(error)) throw new Error('Session expired. Please sign in again.');
        throw error;
      }
    },
    
    onSuccess: async (data, vars) => {
      log.info('Profile mutation: onSuccess - updating cache and syncing AuthContext');
      console.log('Profile update onSuccess - data:', data);
      
      // Update profile detail cache (both old and new query key systems)
      queryClient.setQueryData(queryKeys.profile.detail(vars.id), data);
      queryClient.setQueryData(utilQueryKeys.profile.detail(vars.id), data);
      
      // Update auth.user cache optimistically (both systems) 
      queryClient.setQueryData(queryKeys.auth.user, (oldUser: any) => {
        if (!oldUser) return oldUser;
        const updatedUser = {
          ...oldUser,
          ...data, // Merge all profile fields
          name: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
        };
        log.info('Profile mutation: User cache updated', updatedUser);
        console.log('Profile mutation: User cache updated', updatedUser);
        return updatedUser;
      });
      
      queryClient.setQueryData(utilQueryKeys.auth.user, (oldUser: any) => {
        if (!oldUser) return oldUser;
        const updatedUser = {
          ...oldUser,
          ...data, // Merge all profile fields
          name: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim(),
        };
        return updatedUser;
      });
      
      // CRITICAL: Sync with AuthContext to fix profile screen display
      try {
        await refreshUser();
        log.info('Profile mutation: AuthContext refreshed successfully');
        console.log('Profile mutation: AuthContext refreshed successfully');
      } catch (error) {
        log.error('Profile mutation: Failed to refresh AuthContext:', error);
        console.error('Profile mutation: Failed to refresh AuthContext:', error);
      }
      
      // Force invalidation to ensure consistency (both systems)
      setTimeout(() => {
        // New system
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.profile.detail(vars.id),
          exact: true 
        });
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.auth.user,
          exact: true 
        });
        
        // Old system (for compatibility)
        queryClient.invalidateQueries({ 
          queryKey: utilQueryKeys.profile.detail(vars.id),
          exact: true 
        });
        queryClient.invalidateQueries({ 
          queryKey: utilQueryKeys.auth.user,
          exact: true 
        });
        
        log.info('Profile mutation: Cache invalidated (both systems)');
      }, 50);
    },
    
    onError: (error, vars) => {
      log.error('Profile mutation: onError', error.message);
      console.error('Profile mutation: onError', error.message);
      
      // Invalidate to refresh from server on error (both systems)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user });
      queryClient.invalidateQueries({ queryKey: utilQueryKeys.profile.detail(vars.id) });
      queryClient.invalidateQueries({ queryKey: utilQueryKeys.auth.user });
    },
    
    retry: false,
  });
};
