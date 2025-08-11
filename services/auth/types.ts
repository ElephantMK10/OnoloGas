import type { User as IUser, AuthResult, LoginRequest, RegisterRequest } from '../interfaces';

// Re-export interface types for consistency
export type { IUser as User, AuthResult, LoginRequest, RegisterRequest };

// Auth-specific types
export interface SupabaseUser {
  id: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: SupabaseUser;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
  isCorsError?: boolean;
  isNetworkError?: boolean;
}

export type AuthEventType = 
  | 'SIGNED_IN' 
  | 'SIGNED_OUT' 
  | 'TOKEN_REFRESHED' 
  | 'USER_UPDATED' 
  | 'PASSWORD_RECOVERY';

export interface AuthStateChangeEvent {
  event: AuthEventType;
  session: AuthSession | null;
}

export type AuthStateChangeCallback = (event: AuthStateChangeEvent) => void;