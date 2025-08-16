import { SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Database {}
  }
}

type AuthResponse = {
  data: {
    user: SupabaseUser | null;
    session: Session | null;
  };
  error: Error | null;
};

type SignInWithPasswordCredentials = {
  email: string;
  password: string;
};

type SignUpWithPasswordCredentials = {
  email: string;
  password: string;
  options?: {
    data?: {
      [key: string]: any;
    };
  };
};

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    auth: {
      signInWithPassword: (credentials: SignInWithPasswordCredentials) => Promise<AuthResponse>;
      signUp: (credentials: SignUpWithPasswordCredentials) => Promise<AuthResponse>;
      signOut: () => Promise<{ error: Error | null }>;
      onAuthStateChange: (callback: (event: string, session: Session | null) => void) => { data: { subscription: { unsubscribe: () => void } } };
      getSession: () => Promise<{ data: { session: Session | null }; error: Error | null }>;
      getUser: () => Promise<{ data: { user: SupabaseUser | null }; error: Error | null }>;
    };
  }
}
