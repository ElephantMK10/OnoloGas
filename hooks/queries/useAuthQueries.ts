import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth/AuthService';
import { queryKeys, invalidateQueries } from '../../utils/queryClient';
import type { LoginRequest, RegisterRequest, User } from '../../services/interfaces/IAuthService';

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

// Guest login mutation
export const useGuestLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authService.loginAsGuest(),
    onSuccess: (result) => {
      if (result.success && result.user) {
        queryClient.setQueryData(queryKeys.auth.user, result.user);
        queryClient.setQueryData(queryKeys.auth.session, true);
      }
    },
    onError: (error) => {
      console.error('Guest login mutation error:', error);
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
  const guestLoginMutation = useGuestLogin();
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
    loginAsGuest: guestLoginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    refreshToken: refreshTokenMutation.mutateAsync,
    
    // Refetch functions
    refetchUser: userQuery.refetch,
    refetchAuthStatus: authStatusQuery.refetch,
  };
};