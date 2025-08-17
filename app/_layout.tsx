import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState, Href } from 'expo-router';
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
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initializeConnectionTest } from '../utils/connectionTest';
import { queryClient } from '../utils/queryClient';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import LogoutTransition from '../components/LogoutTransition';
import ErrorBoundary from '../components/ErrorBoundary';
import Toast from 'react-native-toast-message';

// import PerformanceMonitor from '../components/PerformanceMonitor';

// Define typed routes
const ROUTES = {
  TABS: '/(tabs)' as Href,
  WELCOME: '/welcome' as Href,
  AUTH_LOGIN: '/auth/login' as Href,
  AUTH_REGISTER: '/auth/register' as Href,
} as const;

// Simplified Auth guard - only allow authenticated users into app routes
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  console.log('[AuthGuard] render', { isLoading, isAuthenticated });
  const segments = useSegments() as string[];
  const router = useRouter();
  const navState = useRootNavigationState();
  const navReady = !!navState?.key;

  const PUBLIC = new Set(['welcome', 'auth', 'index']);   // public routes (including index)
  const PROTECTED = new Set(['(tabs)', 'home', 'checkout', 'profile', 'order']); // protected routes

  useEffect(() => {
    if (!navReady || isLoading) return;

    const current = segments[0] || '';
    
    // Special handling for empty route - should go to welcome if not authenticated
    if (current === '' && !isAuthenticated) {
      router.replace(ROUTES.WELCOME);
      return;
    }
    
    const isPublic = PUBLIC.has(current);
    const isProtected = PROTECTED.has(current) || (!isPublic && current !== '');

    // If authenticated and on a public route, redirect to main app
    if (isAuthenticated) {
      if (isPublic || current === '') {
        router.replace(ROUTES.TABS);
      }
      return;
    }

    // If not authenticated and trying to access protected route, redirect to login
    if (isProtected) {
      router.replace({
        pathname: ROUTES.AUTH_LOGIN,
        params: { redirectTo: `/${segments.join('/')}` },
      } as any);
    }
  }, [navReady, isLoading, isAuthenticated, segments, router]);

  // Show loading screen during initial load
  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  return <>{children}</>;
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
    if (__DEV__) {
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
    }
  }, []);

  return (
    <ErrorBoundary>
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
              initialRouteName="welcome"
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
            <Toast />
          </ContextProviders>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}