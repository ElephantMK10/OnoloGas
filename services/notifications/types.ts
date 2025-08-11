import type { 
  NotificationSettings as INotificationSettings,
  NotificationPreferences as INotificationPreferences,
  PushNotificationToken as IPushNotificationToken,
  NotificationRequest as INotificationRequest
} from '../interfaces';

// Re-export interface types for consistency
export type { 
  INotificationSettings as NotificationSettings,
  INotificationPreferences as NotificationPreferences,
  IPushNotificationToken as PushNotificationToken,
  INotificationRequest as NotificationRequest
};

// Notification-specific types
export interface NotificationError {
  message: string;
  code?: string;
  details?: any;
}

export interface NotificationHistory {
  id: string;
  userId: string;
  title: string;
  body: string;
  channels: string[];
  status: 'sent' | 'failed' | 'pending';
  createdAt: string;
  sentAt?: string;
}

export type NotificationChannel = 'email' | 'sms' | 'push';

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  channels: NotificationChannel[];
}