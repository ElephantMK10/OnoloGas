import { Platform } from 'react-native';
import { sendMessageToDashboard, DASHBOARD_CONFIG } from '../config/deployment';

// Types for dashboard communication
export interface DashboardMessage {
  type: string;
  data: any;
  timestamp: string;
  source: string;
}

export interface OrderUpdateMessage {
  orderId: string;
  status: string;
  customerEmail?: string;
  totalAmount?: number;
  items?: any[];
}

export interface UserUpdateMessage {
  userId: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
}

export interface PaymentStatusMessage {
  orderId: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  amount?: number;
}

export interface ErrorReportMessage {
  error: string;
  context: string;
  userId?: string;
  orderId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
}

// Dashboard communication utilities
export class DashboardCommunication {
  private static instance: DashboardCommunication;
  private messageQueue: DashboardMessage[] = [];
  private isConnected = false;

  public static getInstance(): DashboardCommunication {
    if (!DashboardCommunication.instance) {
      DashboardCommunication.instance = new DashboardCommunication();
    }
    return DashboardCommunication.instance;
  }

  constructor() {
    this.initializeMessageListener();
  }

  private initializeMessageListener() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('message', this.handleIncomingMessage.bind(this));
      
      // Check if we're in an iframe (embedded in dashboard)
      this.isConnected = window.parent !== window;
      
      if (this.isConnected) {
        console.log('Dashboard communication initialized - app is embedded');
        this.sendHandshake();
      }
    }
  }

  private handleIncomingMessage(event: MessageEvent) {
    // Verify origin is from a trusted dashboard
    const trustedOrigins = DASHBOARD_CONFIG.possibleOrigins;
    if (!trustedOrigins.includes(event.origin)) {
      console.warn('Received message from untrusted origin:', event.origin);
      console.warn('Trusted origins:', trustedOrigins);
      return;
    }

    const message = event.data as DashboardMessage;
    console.log('Received message from dashboard:', message);

    // Handle different message types
    switch (message.type) {
      case 'DASHBOARD_READY':
        this.handleDashboardReady();
        break;
      case 'MANAGER_READY':
        this.handleManagerReady();
        break;
      case 'REQUEST_STATUS':
        this.sendAppStatus();
        break;
      case 'REQUEST_ORDERS':
        this.sendOrdersData();
        break;
      case 'REQUEST_USER_INFO':
        this.sendUserInfo();
        break;
      case 'NAVIGATE_TO':
        this.handleNavigation(message.data);
        break;
      case 'REFRESH_DATA':
        this.handleDataRefresh(message.data);
        break;
      default:
        console.log('Unknown message type from dashboard:', message.type);
    }
  }

  private sendHandshake() {
    this.sendMessage('APP_READY', {
      appName: 'Onolo User App',
      version: '1.0.0',
      capabilities: ['orders', 'payments', 'user-management'],
    });
  }

  private handleDashboardReady() {
    console.log('Dashboard is ready, processing queued messages');
    // Send any queued messages
    this.messageQueue.forEach(message => {
      this.sendMessage(message.type, message.data);
    });
    this.messageQueue = [];
  }

  private handleManagerReady() {
    console.log('Manager dashboard is ready');
    this.sendMessage('USER_APP_READY', {
      appName: 'Onolo User App',
      version: '1.0.0',
      capabilities: ['orders', 'payments', 'user-management'],
      timestamp: new Date().toISOString(),
    });
  }

  private sendOrdersData() {
    // This would need to be connected to your orders context
    console.log('Manager requested orders data');
    this.sendMessage('ORDERS_DATA', {
      message: 'Orders data request received',
      timestamp: new Date().toISOString(),
    });
  }

  private sendUserInfo() {
    // This would need to be connected to your auth context
    console.log('Manager requested user info');
    this.sendMessage('USER_INFO', {
      message: 'User info request received',
      timestamp: new Date().toISOString(),
    });
  }

  private handleDataRefresh(data: any) {
    console.log('Manager requested data refresh:', data);
    // Implement data refresh logic here
  }

  private sendAppStatus() {
    this.sendMessage('APP_STATUS', {
      isReady: true,
      currentRoute: Platform.OS === 'web' ? window.location.pathname : 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  private handleNavigation(data: { route: string; params?: any }) {
    console.log('Dashboard requested navigation to:', data.route);
    // Implement navigation logic here if needed
    // This would depend on your routing setup
  }

  private sendMessage(type: string, data: any) {
    if (this.isConnected) {
      sendMessageToDashboard(type, data);
    } else {
      // Queue message if not connected
      this.messageQueue.push({
        type,
        data,
        timestamp: new Date().toISOString(),
        source: 'onolo-user-app',
      });
    }
  }

  // Public methods for sending specific types of messages
  public sendOrderUpdate(orderData: OrderUpdateMessage) {
    this.sendMessage(DASHBOARD_CONFIG.messageTypes.ORDER_UPDATE, orderData);
  }

  public sendUserUpdate(userData: UserUpdateMessage) {
    this.sendMessage(DASHBOARD_CONFIG.messageTypes.USER_UPDATE, userData);
  }

  public sendPaymentStatus(paymentData: PaymentStatusMessage) {
    this.sendMessage(DASHBOARD_CONFIG.messageTypes.PAYMENT_STATUS, paymentData);
  }

  public sendErrorReport(errorData: ErrorReportMessage) {
    this.sendMessage(DASHBOARD_CONFIG.messageTypes.ERROR_REPORT, errorData);
  }

  public isEmbeddedInDashboard(): boolean {
    return this.isConnected;
  }
}

// Convenience functions
export const dashboardComm = DashboardCommunication.getInstance();

export const notifyOrderCreated = (order: any) => {
  dashboardComm.sendOrderUpdate({
    orderId: order.id,
    status: order.status,
    customerEmail: order.customerEmail,
    totalAmount: order.totalAmount,
    items: order.items,
  });
};

export const notifyOrderStatusChanged = (orderId: string, status: string) => {
  dashboardComm.sendOrderUpdate({
    orderId,
    status,
  });
};

export const notifyPaymentCompleted = (orderId: string, paymentMethod: string, transactionId?: string, amount?: number) => {
  dashboardComm.sendPaymentStatus({
    orderId,
    paymentMethod,
    status: 'completed',
    transactionId,
    amount,
  });
};

export const notifyPaymentFailed = (orderId: string, paymentMethod: string, error?: string) => {
  dashboardComm.sendPaymentStatus({
    orderId,
    paymentMethod,
    status: 'failed',
  });
  
  if (error) {
    dashboardComm.sendErrorReport({
      error,
      context: 'payment',
      orderId,
      timestamp: new Date().toISOString(),
    });
  }
};

export const notifyUserProfileUpdated = (userId: string, updates: Partial<UserUpdateMessage>) => {
  dashboardComm.sendUserUpdate({
    userId,
    ...updates,
  });
};

export const reportError = (error: string, context: string, additionalData?: any) => {
  dashboardComm.sendErrorReport({
    error,
    context,
    timestamp: new Date().toISOString(),
    userAgent: Platform.OS === 'web' ? navigator.userAgent : `React Native ${Platform.OS}`,
    url: Platform.OS === 'web' ? window.location.href : undefined,
    ...additionalData,
  });
};
