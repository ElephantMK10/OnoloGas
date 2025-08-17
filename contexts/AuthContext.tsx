import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { authService } from '../services/auth/AuthService';
import type { User } from '../services/interfaces/IAuthService';

// helper to map session -> minimal User
function userFromSession(session: any): User | null {
  const u = session?.user;
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.name ?? null,
    phone: u.user_metadata?.phone ?? null,
  } as User;
}

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
  const [hasSession, setHasSession] = useState(false);

  // Ref for cleanup
  const isMountedRef = useRef(true);

  // Computed properties
  const isAuthenticated = hasSession;

  // Cleanup on unmount
  // Single source of truth for auth state
  useEffect(() => {
    isMountedRef.current = true;
    let unsubscribe: (() => void) | undefined;
    let cleared = false;

    const clearLoading = () => {
      if (!cleared && isMountedRef.current) {
        cleared = true;
        console.log('AuthContext: set isLoading=false (watchdog/event)');
        setIsLoading(false);
      }
    };

    // If no auth event arrives quickly, don’t block the UI forever
    const watchdog = setTimeout(clearLoading, 2500);

    (async () => {
      try {
        console.log('AuthContext: Initializing minimal auth state...');

        // Subscribe to auth changes first to catch initial session
        const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
          if (!isMountedRef.current) return;
          const sessionPresent = !!session?.user;

          // 1) allow routing immediately
          setHasSession(sessionPresent);

          try {
            if (sessionPresent) {
              // 2) set minimal user immediately so screens can fetch
              const basic = userFromSession(session);
              if (basic && isMountedRef.current) setUser(basic);

              // 3) hydrate full user in background (profile, etc.)
              const fresh = await authService.getCurrentUser().catch(() => null);
              if (fresh && isMountedRef.current) setUser(fresh);
            } else {
              setUser(null);
            }
          } finally {
            if (isMountedRef.current) setIsLoading(false);
          }
        });

        unsubscribe = () => subscription?.unsubscribe?.();

        // Proactively check session once (do not use getCurrentUser for hasSession)
        try {
          const { data: { session } } = await authService.getSession();
          const present = !!session?.user;
          setHasSession(present);
          if (present) {
            const basic = userFromSession(session);
            if (basic && isMountedRef.current) setUser(basic);
            // hydrate in background
            authService.getCurrentUser().then((fresh) => {
              if (fresh && isMountedRef.current) setUser(fresh);
            }).catch(() => {});
          } else {
            setUser(null);
          }
          setIsLoading(false);
        } catch (e) {
          console.error('AuthContext init error:', e);
          setIsLoading(false);
        }

      } catch (error) {
        console.error('AuthContext: Error initializing auth:', error);
        clearLoading();
      }
    })();

    return () => {
      isMountedRef.current = false;
      unsubscribe?.();
      clearTimeout(watchdog);
    };
  }, []);

  // Auth methods
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const watchdog = setTimeout(() => {
      if (isMountedRef.current) {
        console.warn('AuthContext: login watchdog fired, clearing isLoading');
        setIsLoading(false);
      }
    }, 3000);

    try {
      const result = await authService.login({ email, password });
      if (!result.success) {
        if (isMountedRef.current) setIsLoading(false);
        return false;
      }
      // success path: auth event will set hasSession and clear loading
      return true;
    } catch (e) {
      console.error('AuthContext: Login error:', e);
      if (isMountedRef.current) setIsLoading(false);
      return false;
    } finally {
      clearTimeout(watchdog);
    }
  }, []);


  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('AuthContext: Starting registration process for:', email);
      const result = await authService.register({ name, email, password });
      
      if (result.success) {
        console.log('AuthContext: Registration successful');
        
        // Check if there's a session (user is signed in) or if email confirmation is required
        // If the service indicates no session (email confirmation required), stop loading now
      if (!result.user) {
        console.log('AuthContext: No user returned, clearing loading state');
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
        // Otherwise, the auth listener will handle updating the state
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
    if (isLoggingOut) return false;
    setIsLoggingOut(true);

    // Optimistically clear local auth state so guard can route
    if (isMountedRef.current) {
      setUser(null);
      setHasSession(false);
      setIsLoading(false); // do not block UI during logout
    }

    try {
      await authService.logout();
    } finally {
      if (isMountedRef.current) {
        setIsLoggingOut(false);
        setIsLoading(false);
      }
    }
    return true;
  }, [isLoggingOut]);

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
