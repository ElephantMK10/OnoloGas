import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import { OrdersProvider } from '../contexts/OrdersContext';
import { MessagesProvider } from '../contexts/MessagesContext';
import { NotificationsProvider } from '../contexts/NotificationsContext';
import { COLORS } from '../constants/colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter, useSegments } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeConnectionTest } from '../utils/connectionTest';
import { queryClient } from '../utils/queryClient';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import LogoutTransition from '../components/LogoutTransition';

// import PerformanceMonitor from '../components/PerformanceMonitor';

// Simplified Auth guard - let Supabase handle the complexity
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isLoggingOut } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Simple route tracking for debugging
  useEffect(() => {
    console.log('🔍 Route segments changed to:', segments.join('/'));
  }, [segments]);

  useEffect(() => {
    if (isLoading) {
      console.log('AuthGuard: Still loading, skipping navigation logic');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inWelcome = segments[0] === 'welcome';
    const inHome = segments[0] === 'home' || segments.join('/') === '(tabs)';

    console.log('AuthGuard: Route check - segments:', segments.join('/'), {
      user: !!user,
      isLoading,
      inAuthGroup,
      inWelcome,
      inHome
    });

    // ALLOW ALL ROUTES - Don't interfere with navigation
    // Only protect specific routes that absolutely need authentication
    const protectedRoutes = ['checkout', 'profile'];
    const currentRoute = segments[0];

    if (protectedRoutes.includes(currentRoute) && !user) {
      console.log('AuthGuard: Protected route accessed by unauthenticated user, redirecting to auth');
      router.replace('/auth/login');
      return;
    }

  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  return (
    <LogoutTransition isLoggingOut={isLoggingOut}>
      {children}
    </LogoutTransition>
  );
}

// Context providers wrapper to keep layout clean
function ContextProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrdersProvider>
          <MessagesProvider>
            <NotificationsProvider>
              <CartProvider>
                {children}
              </CartProvider>
            </NotificationsProvider>
          </MessagesProvider>
        </OrdersProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  // Initialize connection test on app startup
  useEffect(() => {
    const testConnection = async () => {
      try {
        const success = await initializeConnectionTest();
        
        if (!success) {
          console.warn('⚠️  Some connection issues detected. App functionality may be limited.');
          console.warn('For full functionality, configure CORS in your Supabase project settings.');
        } else {
          console.log('🎉 Supabase connection is working properly');
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        console.warn('⚠️  Connection test failed. App functionality may be limited.');
      }
    };
    
    testConnection();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
          <ContextProviders>
            <StatusBar style="light" />

            <AuthGuard>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
                animation: 'fade',
                animationDuration: 200,
                // Enhanced gesture handling
                gestureEnabled: true,
                gestureDirection: 'horizontal',
              }}
              initialRouteName="index"
            >
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                  animation: 'fade',
                  animationDuration: 150,
                }}
              />
              <Stack.Screen
                name="home"
                options={{
                  headerShown: false,
                  animation: 'fade',
                  animationDuration: 150,
                }}
              />
              <Stack.Screen
                name="(tabs)"
                options={{
                  headerShown: false,
                  animation: 'fade',
                  animationDuration: 150,
                  // Reset stack when navigating to tabs
                  animationTypeForReplace: 'push',
                }}
              />
              <Stack.Screen
                name="checkout"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="profile"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                  // Ensure profile screen doesn't stack - use replace navigation
                  animationTypeForReplace: 'push',
                }}
              />
              <Stack.Screen
                name="order/[id]"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="payfast-success"
                options={{
                  presentation: 'card',
                  gestureEnabled: false,
                }}
              />
              <Stack.Screen
                name="payfast-cancel"
                options={{
                  presentation: 'card',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="welcome"
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  animation: 'fade',
                  animationDuration: 150,
                }}
              />
              <Stack.Screen
                name="auth/login"
                options={{
                  presentation: 'modal',
                  gestureEnabled: false,
                  animation: 'fade',
                  animationDuration: 150,
                  // Prevent going back from login
                  headerLeft: () => null,
                }}
              />
              <Stack.Screen
                name="auth/register"
                options={{
                  presentation: 'modal',
                  gestureEnabled: true,
                }}
              />
              <Stack.Screen
                name="+not-found"
                options={{
                  title: 'Not Found',
                  gestureEnabled: true,
                }}
              />
            </Stack>
          </AuthGuard>
          {/* <PerformanceMonitor /> */}
        </ContextProviders>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}