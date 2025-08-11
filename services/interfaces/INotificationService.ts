export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export interface PushNotificationToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: string;
}

export interface NotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  channels: ('email' | 'sms' | 'push')[];
}

export interface INotificationService {
  /**
   * Get user notification settings
   */
  getNotificationSettings(userId: string): Promise<NotificationSettings>;
  
  /**
   * Update user notification settings
   */
  updateNotificationSettings(
    userId: string, 
    settings: NotificationSettings
  ): Promise<void>;
  
  /**
   * Get user notification preferences
   */
  getNotificationPreferences(userId: string): Promise<NotificationPreferences>;
  
  /**
   * Update user notification preferences
   */
  updateNotificationPreferences(
    userId: string, 
    preferences: NotificationPreferences
  ): Promise<void>;
  
  /**
   * Register device for push notifications
   */
  registerPushToken(token: PushNotificationToken): Promise<void>;
  
  /**
   * Unregister device from push notifications
   */
  unregisterPushToken(userId: string, token: string): Promise<void>;
  
  /**
   * Send notification to user
   */
  sendNotification(request: NotificationRequest): Promise<boolean>;
  
  /**
   * Get notification history for user
   */
  getNotificationHistory(userId: string, limit?: number): Promise<any[]>;
}