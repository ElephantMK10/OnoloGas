import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, PostgrestError } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get environment variables from either EAS (in production) or process.env (in development)
const getConfig = () => {
  // In EAS builds, values come from Constants.expoConfig.extra
  // In development, they come from process.env
  const config = {
    supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: Constants.expoConfig?.extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    mapboxToken: Constants.expoConfig?.extra?.mapboxToken ?? process.env.EXPO_PUBLIC_MAPBOX_TOKEN
  };

  // Debug logging (only in development)
  if (__DEV__) {
    console.log('Supabase Config:', {
      source: Constants.expoConfig?.extra?.supabaseUrl ? 'EAS Build' : 'Local Development',
      url: config.supabaseUrl ? 'Set' : 'Missing',
      key: config.supabaseAnonKey ? 'Set' : 'Missing',
      urlValue: config.supabaseUrl ? `${config.supabaseUrl.substring(0, 25)}...` : 'undefined',
      keyValue: config.supabaseAnonKey ? `${config.supabaseAnonKey.substring(0, 10)}...` : 'undefined',
    });
  }

  return config;
};

const { supabaseUrl, supabaseAnonKey } = getConfig();

// Production runtime check for configuration
if (!__DEV__ && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('=== CRITICAL: PRODUCTION CONFIG MISSING ===');
  console.error('EAS secrets may not be configured correctly');
  console.error('URL exists:', !!supabaseUrl);
  console.error('Key exists:', !!supabaseAnonKey);
  
  // This will be visible in production logs
  if (typeof process !== 'undefined' && process.env) {
    console.error('Process environment keys:', Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('EXPO')));
  }
}

// Debug logging for environment variables (safe for production)
const logEnv = () => {
  if (__DEV__) {
    console.log('Supabase Environment Variables:', {
      url: supabaseUrl ? 'Set' : 'Missing',
      key: supabaseAnonKey ? 'Set' : 'Missing',
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 25)}...` : 'undefined',
      keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'undefined',
    });
  }
};

// Check for missing configuration
const checkConfig = () => {
  const isEAS = !!Constants.expoConfig?.extra?.supabaseUrl;
  const configSource = isEAS ? 'EAS Build' : 'Local Development';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = isEAS 
      ? 'Supabase configuration is missing from EAS build. Please ensure you have set up the required EAS secrets.'
      : 'Supabase configuration is missing. Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file.';
      
    const error = new Error(errorMessage) as any;
    
    error.isConfigError = true;
    error.missingConfig = {
      EXPO_PUBLIC_SUPABASE_URL: !supabaseUrl,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: !supabaseAnonKey,
      configSource
    };
    
    if (__DEV__) {
      console.error(`[${configSource}] Missing Supabase configuration:`, error.missingConfig);
      if (isEAS) {
        console.error('Please run:');
        console.error('  eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "YOUR_SUPABASE_URL"');
        console.error('  eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "YOUR_SUPABASE_ANON_KEY"');
      } else {
        console.error('Please check your .env file or set up EAS secrets for production builds');
      }
    }
    
    return { valid: false, error };
  }
  
  if (__DEV__) {
    console.log(`[${configSource}] Supabase configuration is valid`);
  }
  
  return { valid: true };
};

// Log environment variables in development
logEnv();

// Check configuration early
const configCheck = checkConfig();
if (!configCheck.valid) {
  // In development, we want to throw early to catch configuration issues
  if (__DEV__) {
    throw configCheck.error;
  }
  // In production, we'll handle missing config more gracefully
}

// Enhanced error handler for network requests
const handleNetworkError = (error: any, context: string) => {
  console.error(`Network error in ${context}:`, error);
  
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
    if (Platform.OS === 'web') {
      console.error('🌐 CORS CONFIGURATION REQUIRED!');
      console.error('This error occurs because your development URL is not configured in Supabase CORS settings.');
      console.error('');
      console.error('TO FIX THIS ISSUE:');
      console.error('1. Go to your Supabase Dashboard (https://app.supabase.com)');
      console.error('2. Select your project');
      console.error('3. Go to "Settings" → "API" → "Configuration"');
      console.error('4. Under "Web origins (CORS)", add these URLs:');
      console.error('   Development URLs:');
      console.error('   - http://localhost:8081');
      console.error('   - http://localhost:19006');
      console.error('   - http://localhost:3000');
      console.error('   - http://localhost:3001');
      console.error('   - http://localhost:5173');
      console.error('   User App URLs:');
      console.error('   - https://orders-onologroup.online');
      console.error('   - https://orders-onologroup.netlify.app');
      console.error('   Dashboard URLs:');
      console.error('   - https://manager-onologroup.online');
      console.error('   - https://www.manager-onologroup.online');
      console.error('   - https://manager-onologroup.netlify.app');
      console.error('   - Your current development URL');
      console.error('5. Save the changes and refresh your app');
      console.error('');
      console.error('Current development URL might be:', window?.location?.origin || 'Unknown');
    } else {
      console.error('Network connectivity issue detected. Please check your internet connection.');
    }
  }
  
  // Return a user-friendly error object
  return {
    message: Platform.OS === 'web' 
      ? 'CORS configuration required. Please add your development URL to Supabase CORS settings.'
      : 'Network connection failed. Please check your internet connection.',
    isNetworkError: true,
    isCorsError: Platform.OS === 'web' && (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')),
    originalError: error
  };
};

// Retry logic for network requests
const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (attempt === maxRetries) {
        throw handleNetworkError(error, 'retryRequest');
      }
      
      // Don't retry CORS errors
      if (error.message?.includes('Failed to fetch') && Platform.OS === 'web') {
        throw handleNetworkError(error, 'retryRequest');
      }
      
      console.log(`Request attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

// Create a safe client that won't crash if config is invalid
const createSafeClient = () => {
  if (!configCheck.valid) {
    // Return a mock client with error handling for production
    if (!__DEV__) {
      return {
        auth: {
          signInWithPassword: () => Promise.resolve({ 
            data: { user: null, session: null }, 
            error: { message: 'Configuration error' } 
          }),
          signUp: () => Promise.resolve({ 
            data: { user: null, session: null }, 
            error: { message: 'Configuration error' } 
          }),
          signOut: () => Promise.resolve({ error: { message: 'Configuration error' } }),
          user: () => ({ data: { user: null }, error: { message: 'Configuration error' } }),
          session: () => ({ data: { session: null }, error: { message: 'Configuration error' } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          getSession: () => ({ data: { session: null }, error: { message: 'Configuration error' } }),
          getUser: () => ({ data: { user: null }, error: { message: 'Configuration error' } }),
          refreshSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Configuration error' } }),
        },
        from: () => ({
          select: () => Promise.resolve({ data: null, error: { message: 'Configuration error' } }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Configuration error' } }),
          update: () => Promise.resolve({ data: null, error: { message: 'Configuration error' } }),
          delete: () => Promise.resolve({ data: null, error: { message: 'Configuration error' } }),
          limit: () => ({
            select: () => Promise.resolve({ data: null, error: { message: 'Configuration error' } })
          })
        } as any),
        channel: () => ({
          subscribe: (callback: (status: string, error?: any) => void) => {
            callback('CHANNEL_ERROR', { message: 'Configuration error' });
            return { unsubscribe: () => {} };
          },
          unsubscribe: () => {}
        }),
      };
    }
    throw configCheck.error;
  }

  // Create the actual Supabase client
  return createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    fetch: async (url, options) => {
      try {
        // Add timeout to requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        return response;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please check your connection');
        }
        
        // Handle network errors with better messaging
        if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
          const errorDetails = handleNetworkError(error, 'supabase-client');
          throw new Error(errorDetails.message);
        }
        
        throw error;
      }
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    // Improved timeout and reconnection settings
    heartbeatIntervalMs: 15000, // Reduced from 30000 for faster detection
    reconnectAfterMs: (tries: number) => {
      // More aggressive reconnection strategy
      const baseDelay = Math.min(tries * 500, 5000); // Start with 500ms, max 5s
      console.log(`Realtime reconnection attempt ${tries}, waiting ${baseDelay}ms`);
      return baseDelay;
    },
    // Add timeout configuration
    timeout: 20000, // 20 second timeout for initial connection
    },
  });
};

// Export the safe client
export const supabase = createSafeClient();

// Add a method to check if Supabase is properly configured
export const isSupabaseConfigured = () => configCheck.valid;

// Enhanced connection test function with better error handling and timeout
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection to:', supabaseUrl);

    // Add a timeout wrapper to prevent hanging
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Connection test timeout')), 10000); // 10 second timeout
    });

    const testPromise = retryRequest(async () => {
      // First, test basic connectivity with a simple query that doesn't modify data
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact' }).limit(1);

      if (error) {
        console.log('Supabase query error (this may be expected):', error.message);
        // For RLS or permission errors, the connection is actually working
        if (error.code === 'PGRST116' || error.message.includes('permission denied')) {
          console.log('✅ Connection successful (permission error is expected without RLS policies)');
          return true;
        }
        throw error;
      }

      console.log('✅ Supabase connection test successful');
      return true;
    }, 2, 1000); // Reduce retries to 2 with 1 second delay

    return await Promise.race([testPromise, timeoutPromise]);
  } catch (error: any) {
    if (error.message === 'Connection test timeout') {
      console.error('Connection test timed out after 10 seconds');
    } else {
      const errorDetails = handleNetworkError(error, 'testSupabaseConnection');
      console.error('Connection test failed:', errorDetails.message);
    }
    return false;
  }
};

// Additional utility function to test raw fetch to Supabase
export const testRawConnection = async () => {
  try {
    console.log('Testing raw connection to Supabase REST API...');
    
    return await retryRequest(async () => {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Raw connection failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Raw connection successful');
      return response.ok;
    });
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'testRawConnection');
    console.error('Raw connection failed:', errorDetails.message);
    return false;
  }
};

// Test database operations safely without creating test users
export const testDatabaseOperations = async () => {
  try {
    console.log('Testing database read operations...');
    
    return await retryRequest(async () => {
      // Test a safe read operation that doesn't create data
      const { data, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      if (error) {
        console.log('Database read test result:', error.message);
        // Even permission errors indicate the database is accessible
        const pgError = error as PostgrestError;
        if ((pgError.code === 'PGRST116' || pgError.message.includes('permission denied'))) {
          console.log('✅ Database is accessible (RLS working as expected)');
          return true;
        }
        throw error;
      }

      console.log('✅ Database read test successful');
      return true;
    });
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'testDatabaseOperations');
    console.error('Database read test failed:', errorDetails.message);
    return false;
  }
};

// Test realtime connection specifically
export const testRealtimeConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('🔄 Testing realtime connection...');
    
    let timeoutId: NodeJS.Timeout;
    let resolved = false;
    
    const resolveOnce = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(result);
      }
    };

    // Set up a test channel with shorter timeout
    const testChannel = supabase.channel(`test_${Date.now()}`, {
      config: {
        presence: { key: 'test' },
      },
    });

    // Set timeout for the test
    timeoutId = setTimeout(() => {
      console.log('❌ Realtime connection test timed out');
      testChannel.unsubscribe();
      resolveOnce(false);
    }, 15000) as unknown as NodeJS.Timeout; // 15 second timeout

    testChannel.subscribe((status: string, error?: any) => {
      console.log(`Realtime test status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime connection successful');
        testChannel.unsubscribe();
        resolveOnce(true);
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ Realtime connection failed:', error);
        testChannel.unsubscribe();
        resolveOnce(false);
      } else if (status === 'TIMED_OUT') {
        console.log('❌ Realtime connection timed out');
        testChannel.unsubscribe();
        resolveOnce(false);
      } else if (status === 'CLOSED') {
        console.log('📴 Realtime connection closed');
        if (!resolved) {
          resolveOnce(false);
        }
      }
    });
  });
};

// Comprehensive connection diagnostics with improved error handling
export const runConnectionDiagnostics = async () => {
  try {
    console.log('🔍 Running Supabase connection diagnostics...');
    
    console.log('Environment Variables:', supabaseUrl ? '✅' : '❌', supabaseAnonKey ? '✅' : '❌');
    
    // Skip some tests on web platform if CORS is not configured
    if (Platform.OS === 'web') {
      console.log('🌐 Running web-optimized diagnostics...');
      console.log('Current URL:', window?.location?.origin || 'Unknown');
    }
    
    const rawTest = await testRawConnection();
    
    const clientTest = await testSupabaseConnection();
    
    // Test realtime connection
    const realtimeTest = await testRealtimeConnection();
    
    // Test database operations safely
    const databaseTest = await testDatabaseOperations();
    
    const allPassed = !!(supabaseUrl && supabaseAnonKey) && rawTest && clientTest && realtimeTest && databaseTest;
    
    if (allPassed) {
      console.log('✅ All connection tests passed');
    } else if (clientTest && !realtimeTest) {
      console.log('⚠️  Basic connection works, but realtime features may not work');
      if (Platform.OS === 'web') {
        console.log('💡 This is likely a CORS configuration issue. Add your development URL to Supabase CORS settings:');
        console.log('   1. Go to Supabase Dashboard → Project Settings → API → Configuration');
        console.log('   2. Add your development URL (e.g., http://localhost:8081) to "Web origins (CORS)"');
      }
    } else if (clientTest) {
      console.log('⚠️  Basic connection works, but some advanced features may not work');
    } else {
      if (Platform.OS === 'web') {
        console.log('⚠️  CORS configuration needed for web platform');
        console.log('💡 Add your development URLs to Supabase CORS settings:');
        console.log('   Development URLs:');
        console.log('   - http://localhost:8081');
        console.log('   - http://localhost:19006');
        console.log('   - http://localhost:3000');
        console.log('   - http://localhost:5173');
        console.log('   Production URLs:');
        console.log('   - https://orders-onologroup.online');
        console.log('   - https://orders-onologroup.netlify.app');
        console.log('   - https://manager-onologroup.online');
        console.log('   - https://manager-onologroup.netlify.app');
        console.log('   - Current URL:', window?.location?.origin || 'Unknown');
      } else {
        console.log('❌ Connection issues detected');
      }
    }
    
    return {
      environmentVariables: !!(supabaseUrl && supabaseAnonKey),
      rawConnection: rawTest,
      supabaseClient: clientTest,
      realtimeConnection: realtimeTest,
      databaseOperations: databaseTest,
      platform: Platform.OS,
    };
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'runConnectionDiagnostics');
    console.warn('Connection diagnostics encountered an error:', errorDetails.message);
    
    return {
      environmentVariables: !!(supabaseUrl && supabaseAnonKey),
      rawConnection: false,
      supabaseClient: false,
      realtimeConnection: false,
      databaseOperations: false,
      platform: Platform.OS,
      error: errorDetails.message,
    };
  }
};

// Enhanced wrapper for Supabase operations with automatic error handling
export const supabaseRequest = async <T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  try {
    return await retryRequest(operation);
  } catch (error: any) {
    const errorDetails = handleNetworkError(error, 'supabaseRequest');
    return {
      data: null,
      error: {
        message: errorDetails.message,
        isNetworkError: errorDetails.isNetworkError,
        isCorsError: errorDetails.isCorsError,
        originalError: errorDetails.originalError
      }
    };
  }
};