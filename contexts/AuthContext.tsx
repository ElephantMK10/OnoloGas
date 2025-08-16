import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { authService } from '../services/auth/AuthService';
import type { User } from '../services/interfaces/IAuthService';

// Minimal Auth Context Types - Let Supabase handle the complexity
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  isAuthenticated: boolean;

  // Auth methods - all return Promise<boolean> to indicate success/failure
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  refreshUser: () => Promise<boolean>;
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
  const isAuthenticated = !!user;

  // Cleanup on unmount
  // Single source of truth for auth state
  useEffect(() => {
    isMountedRef.current = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        console.log('AuthContext: Initializing minimal auth state...');

        // Subscribe to auth changes first to catch initial session
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
          if (!isMountedRef.current) return;

          if (__DEV__) {
            console.log('AuthContext: Auth state change:', event, 'Session exists:', !!session?.user);
          }

          try {
            switch (event) {
              case 'INITIAL_SESSION': {
                if (session?.user) {
                  const fresh = await authService.getCurrentUser();
                  if (isMountedRef.current) {
                    setUser(fresh ?? null);
                  }
                } else {
                  setUser(null);
                }
                break;
              }
              case 'SIGNED_IN':
              case 'TOKEN_REFRESHED':
              case 'USER_UPDATED': {
                const fresh = await authService.getCurrentUser();
                if (isMountedRef.current) {
                  setUser(fresh ?? null);
                  if (__DEV__) {
                    console.log('AuthContext: User updated from auth state change:', fresh?.email);
                  }
                }
                break;
              }
              case 'SIGNED_OUT': {
                if (isMountedRef.current) {
                  setUser(null);
                  setIsLoggingOut(false);
                  if (__DEV__) {
                    console.log('AuthContext: User signed out from auth state change');
                  }
                }
                break;
              }
              default:
                // ignore other events
                break;
            }
          } catch (error) {
            if (__DEV__) {
              console.error('AuthContext: Error handling auth state change:', error);
            }
          } finally {
            if (isMountedRef.current) {
              setIsLoading(false);
            }
          }
        });

        authSubscriptionRef.current = subscription;
        // Simplified unsubscribe with optional chaining
        unsubscribe = () => subscription?.unsubscribe?.();

        // Initial user fetch is now handled by the INITIAL_SESSION event
      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        if (isMountedRef.current) setIsLoading(false);
      }
    })();

    // Cleanup must be returned from the effect, not from inside try
    return () => {
      isMountedRef.current = false;
      unsubscribe?.();
      authSubscriptionRef.current = null;
    };
  }, []); // Empty dependency array as authService is a module import

  // Auth methods
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await authService.login({ email, password });
      if (result.success) {
        return true; // listener will update user and flip loading off
      }
      // Convert to boolean to match other methods' return type
      return false;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      if (isMountedRef.current) setIsLoading(false);
      return false;
    }
  }, []);


  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Starting registration process for:', email);
      const result = await authService.register({ name, email, password });
      
      if (result.success) {
        console.log('AuthContext: Registration successful, waiting for auth state change');
        // DO NOT set isLoading to false here - the auth state change listener will handle it
        return true;
      }
      
      // If we get here, registration failed but didn't throw
      console.error('AuthContext: Registration failed:', result.error);
      if (isMountedRef.current) setIsLoading(false);
      return false;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      if (isMountedRef.current) setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<boolean> => {
    if (!authService) return false;
    
    if (__DEV__) {
      console.log('AuthContext: Starting logout process');
    }

    // Set logout state to trigger smooth transition
    setIsLoggingOut(true);
    setIsLoading(true);

    // Create a safety timeout in case the SIGNED_OUT event doesn't fire
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        if (__DEV__) {
          console.warn('AuthContext: Logout timeout reached, forcing completion');
        }
        setUser(null);
        setIsLoading(false);
        setIsLoggingOut(false);
      }
    }, 5000);

    try {
      await authService.logout();
      
      // Clear the timeout on successful logout
      clearTimeout(timeoutId);
      
      // Don't clear user state here - let the auth state change listener handle it
      return true;
      
    } catch (error) {
      if (__DEV__) {
        console.error('AuthContext: Logout service error:', error);
      }
      // Clear the timeout on error
      clearTimeout(timeoutId);
      
      // Still need to clear the loading state on error
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsLoggingOut(false);
      }
      return false;
    }
  }, [user]);

  const refreshUser = useCallback(async (): Promise<boolean> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (isMountedRef.current) {
        setUser(currentUser);
        return true;
      }
      return false;
    } catch (error) {
      if (__DEV__) {
        console.error('AuthContext: Error refreshing user:', error);
      }
      return false;
    }
  }, []);

  // Memoize methods separately to prevent unnecessary re-renders
  const methods = useMemo(() => ({
    login,
    register,
    logout,
    refreshUser,
  }), [
    login,
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
    ...methods,
  }), [
    user,
    isLoading,
    isLoggingOut,
    isAuthenticated,
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