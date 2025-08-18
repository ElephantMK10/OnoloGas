import { supabase, supabaseRequest } from '../../lib/supabase';
import type { 
  IAuthService, 
  AuthResult, 
  User, 
  LoginRequest, 
  RegisterRequest 
} from '../interfaces/IAuthService';
import type { SupabaseProfile } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export class AuthService implements IAuthService {
  private static instance: AuthService;
  
  // Singleton pattern to ensure one instance
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Authenticate user with email and password
   */
  async login(request: LoginRequest): Promise<AuthResult> {
    try {
      console.log('AuthService: Attempting login for:', request.email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: request.email,
        password: request.password,
      });

      if (error || !data.user) {
        console.error('AuthService: Login failed:', error?.message);

        // Provide more specific error messages based on the error type
        let errorMessage = 'Login failed';

        if (error?.message) {
          // Map Supabase error messages to user-friendly messages
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Invalid login credentials';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Email not confirmed';
          } else if (error.message.includes('Too many requests')) {
            errorMessage = 'Too many requests';
          } else if (error.message.includes('User not found')) {
            errorMessage = 'Invalid login credentials';
          } else {
            errorMessage = error.message;
          }
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      // Wait a moment for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      // Load user profile
      const user = await this.loadUserProfile(data.user.id);
      if (!user) {
        console.error('AuthService: Failed to load user profile after login');
        return {
          success: false,
          error: 'Failed to load user profile',
        };
      }

      console.log('AuthService: Login successful for:', user.email);
      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('AuthService: Login error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Create a new user account
   */
  async register(request: RegisterRequest): Promise<AuthResult> {
    try {
      console.log('AuthService: Attempting registration for:', request.email);

      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            name: request.name,
            full_name: request.name,
          }
        }
      });

      if (authError || !authData.user) {
        console.error('AuthService: Registration failed:', authError?.message);
        return {
          success: false,
          error: authError?.message || 'Registration failed',
        };
      }

      // Wait a moment for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create profile
      const nameParts = request.name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          role: 'customer',
        });

      if (profileError) {
        console.error('AuthService: Profile creation failed:', profileError.message);
        // Clean up auth user if profile creation fails
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Failed to create user profile',
        };
      }

      // Load the complete user profile to ensure consistency
      const user = await this.loadUserProfile(authData.user.id);
      if (!user) {
        console.error('AuthService: Failed to load user profile after registration');
        // Try to create a basic user profile from auth data as fallback
        const fallbackUser: User = {
          id: authData.user.id,
          name: request.name,
          email: request.email,
          phone: '',
          address: '',
          isGuest: false,
        };
        console.log('AuthService: Using fallback user profile after registration');

        // Send welcome email for fallback user
        this.sendWelcomeEmail(request.email, firstName, lastName);

        return {
          success: true,
          user: fallbackUser,
        };
      }

      console.log('AuthService: Registration successful for:', request.email, 'User loaded:', user.name);

      // Send welcome email (backup to database trigger)
      this.sendWelcomeEmail(request.email, firstName, lastName);

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      console.error('AuthService: Registration error:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Sign out current user
   */
  async logout(): Promise<void> {
    try {
      console.log('AuthService: Logging out user');

      // 1) Clear local persisted session first so UI can move on immediately
      try { await supabase.auth.signOut({ scope: 'local' } as any); } catch {}

      // 2) Fire-and-forget global sign out; do not block UX
      supabase.auth.signOut({ scope: 'global' } as any).catch(() => {});

      // 3) Failsafe: purge any leftover Supabase auth-token keys
      try {
        const keys = await AsyncStorage.getAllKeys();
        const authKeys = keys.filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (authKeys.length) {
          console.log('[Auth] Purging leftover supabase auth keys:', authKeys);
          await AsyncStorage.multiRemove(authKeys);
        }
      } catch (e) {
        console.warn('[Auth] purge tokens error', e);
      }
    } catch (error) {
      console.warn('AuthService: logout exception', error);
    }
  }


  /**
   * Send magic link for passwordless login
   */
  async sendMagicLink(email: string): Promise<AuthResult> {
    console.warn('Magic link login is disabled');
    return { success: false, error: 'Magic link login is disabled' };
  }

  /**
   * Create a guest session
   */
  async loginAsGuest(): Promise<AuthResult> {
    console.warn('Guest auth is disabled');
    return { success: false, error: 'Guest checkout is disabled' };
  }

  /**
   * Send welcome email via Supabase Edge Function
   * This is a backup to the database trigger
   */
  private async sendWelcomeEmail(email: string, firstName: string, lastName?: string): Promise<void> {
    console.log('AuthService: Welcome email functionality disabled');
    // Welcome email functionality is disabled
  }

  /**
   * Create a new guest session (for switching guest sessions)
   */
  async createNewGuestSession(): Promise<AuthResult> {
    console.warn('Guest auth is disabled');
    return { success: false, error: 'Guest checkout is disabled' };
  }

  /**
   * Get current session
   */
  async getSession() {
    return supabase.auth.getSession();
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('AuthService: Error getting session:', error);
        return null;
      }

      if (!session?.user) {
        console.log('AuthService: No active session found');
        return null;
      }

      console.log('AuthService: Active session found for user:', session.user.email);
      const user = await this.loadUserProfile(session.user.id);

      if (user) {
        console.log('AuthService: Current user loaded:', user.name, user.isGuest ? '(Guest)' : '(Authenticated)');
      }

      return user;
    } catch (error: any) {
      console.error('AuthService: Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session?.user;
    } catch (error: any) {
      console.error('AuthService: Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthService: Token refresh failed:', error);
        return false;
      }

      return !!data.session;
    } catch (error: any) {
      console.error('AuthService: Token refresh error:', error);
      return false;
    }
  }

  /**
   * Load user profile from database with enhanced error handling
   * @private
   */
  private async loadUserProfile(userId: string): Promise<User | null> {
    try {
      console.log('AuthService: Loading profile for user:', userId);

      // First, get the auth user to ensure we have the email
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('AuthService: Error getting auth user:', authError);
        return null;
      }

      if (!authUser) {
        console.error('AuthService: No authenticated user found');
        return null;
      }

      // Read from public.profiles table using the user ID
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Check for CORS error and provide clearer guidance
        if (error.code === 'PGRST116') {
          console.error('AuthService: Profile not found for user:', userId);
          // Return fallback profile with auth user data
          return {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            phone: '',
            address: '',
            isGuest: false,
            _fallback: true,
          };
        }

        console.error('AuthService: Error loading profile:', error.message);
        return null;
      }

      if (!profiles) {
        console.error('AuthService: Profile not found for user:', userId);
        return null;
      }

      const user: User = {
        id: profiles.id,
        name: `${profiles.first_name || ''} ${profiles.last_name || ''}`.trim() || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        phone: profiles.phone || '',
        address: profiles.address || '',
        isGuest: false,
      };

      console.log('AuthService: Profile loaded successfully for:', user.name);
      return user;
    } catch (error: any) {
      console.error('AuthService: Error in loadUserProfile:', error);
      return null;
    }
  }
  

  /**
   * Set up auth state change listener
   */
  public onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();