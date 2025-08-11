import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { authService } from '../services/auth/AuthService';
import type { User } from '../services/interfaces/IAuthService';

// Minimal Auth Context Types - Let Supabase handle the complexity
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;

  // Auth methods - simplified
  login: (email: string, password: string) => Promise<boolean>;
  loginAsGuest: () => Promise<void>;
  createNewGuestSession: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Minimal state - let Supabase handle the rest
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const authSubscriptionRef = useRef<any>(null);

  // Computed properties
  const isAuthenticated = !!user && !user.isGuest;
  const isGuest = !!user && user.isGuest;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
    };
  }, []);

  // Minimal auth initialization - let Supabase do the heavy lifting
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('AuthContext: Initializing minimal auth state...');

        // Get initial session - simple and direct
        const currentUser = await authService.getCurrentUser();
        if (currentUser && isMountedRef.current) {
          setUser(currentUser);
        }

        // Minimal auth state listener - only respond to successful auth events
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
          if (!isMountedRef.current) return;

          console.log('AuthContext: Auth state change:', event, 'Session exists:', !!session?.user);

          // Handle sign-in events to update user state immediately
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('AuthContext: User signed in, updating user state');
            const currentUser = await authService.getCurrentUser();
            if (currentUser && isMountedRef.current) {
              setUser(currentUser);
            }
          }

          // Only respond to successful authentication events, ignore failed login attempts
          if (event === 'SIGNED_IN' && session?.user) {
            console.log('AuthContext: Processing successful sign in');
            const user = await authService.getCurrentUser();
            if (user && isMountedRef.current) {
              setUser(user);
            }
          } else if (event === 'SIGNED_OUT') {
            console.log('AuthContext: Processing sign out');
            // Only clear user on explicit sign out, not on failed login attempts
            setUser(null);
          } else {
            console.log('AuthContext: Ignoring auth event:', event);
          }
          // Ignore other events like 'TOKEN_REFRESHED', failed logins, etc.

          // Always set loading to false after any auth event
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        });

        authSubscriptionRef.current = subscription;

        // Set loading to false after initial setup
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
  }, []);

  // Auth methods
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const result = await authService.login({ email, password });

      if (result.success && result.user) {
        setUser(result.user);
        return true;
      }

      // If login failed, throw an error - let the component handle it
      throw new Error(result.error || 'Login failed');
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      // Just re-throw - no complex state management
      throw error;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const loginAsGuest = useCallback(async (): Promise<void> => {
    try {
      const result = await authService.loginAsGuest();

      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('AuthContext: Guest login error:', error);
    }
  }, []);

  const createNewGuestSession = useCallback(async (): Promise<void> => {
    try {
      const result = await authService.createNewGuestSession();

      if (result.success && result.user) {
        setUser(result.user);
      }
    } catch (error) {
      console.error('AuthContext: Create new guest session error:', error);
    }
  }, []);



  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('AuthContext: Starting registration process for:', email);

      const result = await authService.register({ name, email, password });

      if (result.success && result.user) {
        console.log('AuthContext: Registration successful, updating user state');
        setUser(result.user);

        // Brief wait for auth state to be processed
        await new Promise(resolve => setTimeout(resolve, 200));

        // Verify user state is set
        const currentUser = await authService.getCurrentUser();
        if (currentUser && isMountedRef.current) {
          console.log('AuthContext: User state confirmed after registration');
          setUser(currentUser);
        }

        return true;
      }

      console.log('AuthContext: Registration failed');
      return false;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        console.log('AuthContext: Registration process completed');
      }
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('AuthContext: Starting logout process for user:', user?.isGuest ? 'guest' : 'registered');

      // Set logout state to trigger smooth transition
      setIsLoggingOut(true);

      // Create a timeout to prevent getting stuck in logout state
      const timeoutId = setTimeout(() => {
        console.warn('AuthContext: Logout timeout reached, forcing completion');
        if (isMountedRef.current) {
          setUser(null);
          setIsLoggingOut(false);
        }
      }, 5000); // 5 second timeout

      try {
        if (user?.isGuest) {
          await authService.logoutGuest(user.id);
          console.log('AuthContext: Guest logout completed');
        } else {
          await authService.logout();
          console.log('AuthContext: Registered user logout completed');
        }

        // Clear the timeout since logout completed successfully
        clearTimeout(timeoutId);

        // Shorter delay to prevent stuck state
        const delay = user?.isGuest ? 100 : 200;
        await new Promise(resolve => setTimeout(resolve, delay));

        if (isMountedRef.current) {
          setUser(null);
          console.log('AuthContext: User state cleared');
        }

        // Shorter delay before clearing logout state
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsLoggingOut(false);
            console.log('AuthContext: Logout transition completed');
          }
        }, 200);

      } catch (logoutError) {
        console.error('AuthContext: Logout service error:', logoutError);
        clearTimeout(timeoutId);

        // Force clear user state even if logout service fails
        if (isMountedRef.current) {
          setUser(null);
          setIsLoggingOut(false);
        }
      }

    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      // Always clear logout state on any error
      if (isMountedRef.current) {
        setUser(null);
        setIsLoggingOut(false);
      }
    }
  }, [user]);

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser && isMountedRef.current) {
        setUser(currentUser);
      }
    } catch (error) {
      console.error('AuthContext: Refresh user error:', error);
    }
  }, []);

  // Memoize methods separately to prevent unnecessary re-renders
  const methods = useMemo(() => ({
    login,
    loginAsGuest,
    createNewGuestSession,
    register,
    logout,
    refreshUser,
  }), [
    login,
    loginAsGuest,
    createNewGuestSession,
    register,
    logout,
    refreshUser,
  ]);

  // Memoize the context value with minimal dependencies
  const value: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    isLoggingOut,
    isAuthenticated,
    isGuest,
    ...methods,
  }), [
    user,
    isLoading,
    isLoggingOut,
    isAuthenticated,
    isGuest,
    methods,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}