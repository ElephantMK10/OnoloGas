import { supabase, supabaseRequest } from '../../lib/supabase';
import type { 
  IAuthService, 
  AuthResult, 
  User, 
  LoginRequest, 
  RegisterRequest 
} from '../interfaces/IAuthService';
import type { SupabaseProfile } from './types';

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

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
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

      // Add timeout to prevent hanging
      const logoutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Logout timeout')), 3000)
      );

      await Promise.race([logoutPromise, timeoutPromise]);
      console.log('AuthService: Logout successful');
    } catch (error: any) {
      console.error('AuthService: Logout error:', error);
      // Don't throw error for logout, just log it
      // Even if logout fails, we'll clear local state
    }
  }

  /**
   * Clear guest session and associated data
   */
  async logoutGuest(guestUserId?: string): Promise<void> {
    try {
      console.log('AuthService: Clearing guest session for:', guestUserId);

      if (guestUserId) {
        // Add timeout for AsyncStorage operations
        const clearGuestData = async () => {
          // Import AsyncStorage dynamically to avoid issues
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;

          // Clear guest-specific orders
          const ordersKey = `@onolo_orders_${guestUserId}`;
          await AsyncStorage.removeItem(ordersKey);
          console.log('AuthService: Cleared guest orders for:', guestUserId);

          // Clear any other guest-specific data if needed
          // Add more cleanup here as needed
        };

        // Add timeout to prevent hanging on AsyncStorage operations
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Guest logout timeout')), 2000)
        );

        await Promise.race([clearGuestData(), timeoutPromise]);
      }

      console.log('AuthService: Guest session cleared');
    } catch (error: any) {
      console.error('AuthService: Guest logout error:', error);
      // Don't throw error for logout, just log it
      // Even if cleanup fails, we'll clear the session
    }
  }

  /**
   * Send magic link for passwordless login
   */
  async sendMagicLink(email: string): Promise<AuthResult> {
    try {
      console.log('AuthService: Sending magic link to:', email);

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'onolo://home'
        }
      });

      if (error) {
        console.error('AuthService: Magic link failed:', error.message);
        return {
          success: false,
          error: error.message || 'Failed to send magic link',
        };
      }

      console.log('AuthService: Magic link sent successfully');
      return {
        success: true,
      };
    } catch (error: any) {
      console.error('AuthService: Magic link error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send magic link',
      };
    }
  }

  /**
   * Create a guest session
   */
  async loginAsGuest(): Promise<AuthResult> {
    try {
      console.log('AuthService: Creating guest session');

      const guestUser: User = {
        id: 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        name: 'Guest User',
        email: '',
        phone: '',
        address: '',
        isGuest: true,
      };

      console.log('AuthService: Created guest user with ID:', guestUser.id);
      return {
        success: true,
        user: guestUser,
      };
    } catch (error: any) {
      console.error('AuthService: Guest login error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create guest session',
      };
    }
  }

  /**
   * Send welcome email via Supabase Edge Function
   * This is a backup to the database trigger
   */
  private async sendWelcomeEmail(email: string, firstName: string, lastName?: string): Promise<void> {
    try {
      console.log('AuthService: Sending welcome email to:', email);

      const { data, error } = await supabase.functions.invoke('welcome-email', {
        body: {
          email,
          firstName,
          lastName,
        },
      });

      if (error) {
        console.error('AuthService: Welcome email error:', error);
        return;
      }

      console.log('AuthService: Welcome email sent successfully:', data);
    } catch (error: any) {
      console.error('AuthService: Welcome email exception:', error);
      // Don't throw error - welcome email failure shouldn't break registration
    }
  }

  /**
   * Create a new guest session (for switching guest sessions)
   */
  async createNewGuestSession(): Promise<AuthResult> {
    console.log('AuthService: Creating new guest session');
    return this.loginAsGuest();
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

      // Use enhanced error handling wrapper for profile
      const { data: profiles, error } = await supabaseRequest(async () =>
        await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
      );

      // Handle the response properly
      const profile = profiles && profiles.length > 0 ? profiles[0] : null;

      if (error) {
        // Check for CORS error and provide clearer guidance
        if (error.isCorsError) {
          console.error('AuthService: CORS error loading profile. Please configure CORS in Supabase dashboard.');
          // Return fallback profile with auth user data
          return {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            phone: '',
            address: '',
            isGuest: false,
          };
        }

        console.error('AuthService: Error loading profile:', error.message);
        return null;
      }

      if (!profile) {
        console.error('AuthService: Profile not found for user:', userId);
        // Return basic user from auth data
        return {
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          phone: '',
          address: '',
          isGuest: false,
        };
      }

      const user: User = {
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
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
   * Create a fallback profile when profile loading fails
   * @private
   */
  private createFallbackProfile(userId: string): User {
    console.log('AuthService: Creating fallback profile for:', userId);
    
    // Create a minimal user object to prevent app crashes
    return {
      id: userId,
      name: 'User',
      email: '',
      phone: '',
      address: '',
      isGuest: false,
      // Flag indicating this is a fallback profile that should be refreshed
      _fallback: true,
    };
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