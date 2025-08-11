import { Platform } from 'react-native';

// Centralized deployment configuration
export const DEPLOYMENT_CONFIG = {
  // Production URLs
  production: {
    domain: 'https://orders-onologroup.online',
    netlify: 'https://orders-onologroup.netlify.app',
  },
  
  // Development URLs
  development: {
    expo: 'http://localhost:8081',
    web: 'http://localhost:19006',
    metro: 'http://localhost:3000',
  },
  
  // API endpoints
  api: {
    payfast: {
      production: 'https://www.payfast.co.za/eng/process',
      sandbox: 'https://sandbox.payfast.co.za/eng/process',
    },
  },
  
  // Email configuration
  email: {
    from: 'Onolo Gas <orders@orders-onologroup.online>',
    domain: 'orders-onologroup.online',
  },
  
  // CORS origins for Supabase
  corsOrigins: [
    // Development URLs
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5000',
    'http://localhost:5173',
    'http://localhost:8080',
    // User app production URLs
    'https://orders-onologroup.online',
    'https://orders-onologroup.netlify.app',
    // Dashboard/Management app production URLs
    'https://manager-onologroup.online',
    'https://www.manager-onologroup.online',
    'https://manager-onologroup.netlify.app',
  ],
};

// Helper functions
export const getCurrentBaseUrl = (): string => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Use current origin if in browser
    return window.location.origin;
  }
  
  // Default to production domain for mobile/native
  return DEPLOYMENT_CONFIG.production.domain;
};

export const getApiBaseUrl = (): string => {
  // Always use production domain for API calls
  return DEPLOYMENT_CONFIG.production.domain;
};

export const getPaymentReturnUrls = (orderId: string) => {
  const baseUrl = getApiBaseUrl();
  return {
    payfast: {
      returnUrl: `${baseUrl}/payfast-success?orderId=${orderId}`,
      cancelUrl: `${baseUrl}/payfast-cancel?orderId=${orderId}`,
      notifyUrl: `${baseUrl}/api/payfast-notify`,
    },
  };
};

export const isDevelopment = (): boolean => {
  return __DEV__ || process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return !isDevelopment();
};

// Dashboard/Management app communication
export const DASHBOARD_CONFIG = {
  // URLs where the dashboard might be hosted
  possibleOrigins: [
    // User app URLs (for cross-communication)
    'https://orders-onologroup.online',
    'https://orders-onologroup.netlify.app',
    // Dashboard/Management app URLs
    'https://manager-onologroup.online',
    'https://www.manager-onologroup.online',
    'https://manager-onologroup.netlify.app',
    // Development URLs
    'http://localhost:8081', // Expo dev server
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:5173', // Vite dev server
    'http://localhost:4173', // Vite preview
    'http://localhost:3001', // Alternative dev port
    'http://localhost:5000', // Alternative dev port
  ],
  
  // Message types for communication
  messageTypes: {
    ORDER_UPDATE: 'ORDER_UPDATE',
    USER_UPDATE: 'USER_UPDATE',
    PAYMENT_STATUS: 'PAYMENT_STATUS',
    ERROR_REPORT: 'ERROR_REPORT',
  },
};

// Function to send messages to parent dashboard (if in iframe)
export const sendMessageToDashboard = (type: string, data: any) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.parent !== window) {
    const message = {
      type,
      data,
      timestamp: new Date().toISOString(),
      source: 'onolo-user-app',
    };
    
    // Try each possible origin
    DASHBOARD_CONFIG.possibleOrigins.forEach(origin => {
      try {
        window.parent.postMessage(message, origin);
      } catch (error) {
        console.debug(`Failed to send message to ${origin}:`, error);
      }
    });
  }
};
