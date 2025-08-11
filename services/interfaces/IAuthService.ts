export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isGuest: boolean;
  securitySettings?: {
    biometricLogin?: boolean;
    twoFactorAuth?: boolean;
  };
  _fallback?: boolean; // Flag for profiles loaded with fallback mechanism
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface IAuthService {
  /**
   * Authenticate user with email and password
   */
  login(request: LoginRequest): Promise<AuthResult>;
  
  /**
   * Create a new user account
   */
  register(request: RegisterRequest): Promise<AuthResult>;
  
  /**
   * Sign out current user
   */
  logout(): Promise<void>;
  
  /**
   * Create a guest session
   */
  loginAsGuest(): Promise<AuthResult>;
  
  /**
   * Get current authenticated user
   */
  getCurrentUser(): Promise<User | null>;
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): Promise<boolean>;
  
  /**
   * Refresh authentication token
   */
  refreshToken(): Promise<boolean>;
}