import { supabase, runConnectionDiagnostics } from '@/lib/supabase';

// Utility to test connection on app startup
export const initializeConnectionTest = async () => {
  console.log('🚀 Initializing Supabase connection...');
  
  try {
    const diagnostics = await runConnectionDiagnostics();
    
    if (!diagnostics.environmentVariables) {
      console.error('❌ Missing environment variables. Check your .env file.');
      return false;
    }
    
    if (!diagnostics.rawConnection) {
      console.warn('⚠️  Raw connection failed. This may be due to CORS settings.');
      console.warn('Add your development URL to Supabase CORS settings if needed.');
    }
    
    if (!diagnostics.supabaseClient) {
      console.warn('⚠️  Supabase client connection failed. This is likely a CORS issue.');
      console.warn('Your app may work once deployed or with proper CORS configuration.');
      return false; // This is the critical test
    }
    
    if (!diagnostics.realtimeConnection) {
      console.warn('⚠️  Realtime connection failed. Chat and live updates may not work.');
      console.warn('💡 To fix this, add your development URL to Supabase CORS settings:');
      console.warn('   - Go to Supabase Dashboard → Project Settings → API → Configuration');
      console.warn('   - Add your development URL to "Web origins (CORS)"');
      console.warn('   - For Expo web: http://localhost:19006');
      console.warn('   - For Expo dev server: http://localhost:8081');
    }
    
    if (!diagnostics.databaseWrite) {
      console.warn('⚠️  Database write test failed. Basic read operations should still work.');
    }
    
    console.log('✅ Supabase connection established successfully');
    return true;
  } catch (error: any) {
    console.warn('Connection test failed:', error.message);
    return false;
  }
};

// Helper function to retry failed operations
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError!;
};

// Enhanced order creation with retry logic
export const createOrderWithRetry = async (orderData: any) => {
  return retryOperation(async () => {
    console.log('Creating order with data:', orderData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();
    
    if (error) {
      console.error('Order creation failed:', error);
      throw new Error(`Order creation failed: ${error.message}`);
    }
    
    console.log('Order created successfully:', data);
    return data;
  }, 3, 1000);
};

// Helper function to test if realtime subscriptions are working
export const testRealtimeSubscription = async (testDuration: number = 10000): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('🧪 Testing realtime subscription functionality...');
    
    let resolved = false;
    const resolveOnce = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    // Create a test subscription
    const testChannelName = `test_subscription_${Date.now()}`;
    const testChannel = supabase.channel(testChannelName);

    // Set overall test timeout
    const testTimeout = setTimeout(() => {
      console.log('❌ Realtime subscription test timed out');
      testChannel.unsubscribe();
      supabase.removeChannel(testChannel);
      resolveOnce(false);
    }, testDuration);

    testChannel.subscribe((status: string, error?: any) => {
      console.log(`Test subscription status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Realtime subscription test successful');
        clearTimeout(testTimeout);
        testChannel.unsubscribe();
        supabase.removeChannel(testChannel);
        resolveOnce(true);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.log('❌ Realtime subscription test failed:', error || 'Timed out');
        clearTimeout(testTimeout);
        testChannel.unsubscribe();
        supabase.removeChannel(testChannel);
        resolveOnce(false);
      }
    });
  });
};