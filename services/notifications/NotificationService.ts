import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { 
  INotificationService,
  NotificationSettings,
  NotificationPreferences,
  PushNotificationToken,
  NotificationRequest
} from '../interfaces/INotificationService';
import type { NotificationHistory } from './types';

export class NotificationService implements INotificationService {
  private static instance: NotificationService;
  
  // Storage keys
  private readonly SETTINGS_KEY = '@onolo_notification_settings';
  private readonly PREFERENCES_KEY = '@onolo_notification_preferences';
  private readonly HISTORY_KEY = '@onolo_notification_history';
  
  // Singleton pattern to ensure one instance
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Get user notification settings
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      console.log('NotificationService: Getting notification settings for user:', userId);
      
      const settingsStr = await AsyncStorage.getItem(`${this.SETTINGS_KEY}_${userId}`);
      
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        console.log('NotificationService: Settings loaded from storage');
        return settings;
      }
      
      // Default settings
      const defaultSettings: NotificationSettings = {
        email: true,
        sms: true,
        push: Platform.OS !== 'web',
      };
      
      console.log('NotificationService: Using default settings');
      return defaultSettings;
    } catch (error: any) {
      console.error('NotificationService: Error getting settings:', error);
      throw new Error(error.message || 'Failed to get notification settings');
    }
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: NotificationSettings
  ): Promise<void> {
    try {
      // Validate settings object
      if (!settings || typeof settings !== 'object') {
        throw new Error('Invalid settings object provided');
      }

      // Ensure all required properties exist with default values
      const validatedSettings: NotificationSettings = {
        email: settings.email ?? true,
        sms: settings.sms ?? true,
        push: settings.push ?? (Platform.OS !== 'web'),
      };

      console.log('NotificationService: Updating notification settings for user:', userId, validatedSettings);

      await AsyncStorage.setItem(
        `${this.SETTINGS_KEY}_${userId}`,
        JSON.stringify(validatedSettings)
      );

      console.log('NotificationService: Settings updated successfully');
    } catch (error: any) {
      console.error('NotificationService: Error updating settings:', error);
      throw new Error(error.message || 'Failed to update notification settings');
    }
  }

  /**
   * Get user notification preferences
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      console.log('NotificationService: Getting notification preferences for user:', userId);
      
      const preferencesStr = await AsyncStorage.getItem(`${this.PREFERENCES_KEY}_${userId}`);
      
      if (preferencesStr) {
        const preferences = JSON.parse(preferencesStr);
        console.log('NotificationService: Preferences loaded from storage');
        return preferences;
      }
      
      // Default preferences
      const defaultPreferences: NotificationPreferences = {
        orderUpdates: true,
        promotions: true,
        newsletter: true,
      };
      
      console.log('NotificationService: Using default preferences');
      return defaultPreferences;
    } catch (error: any) {
      console.error('NotificationService: Error getting preferences:', error);
      throw new Error(error.message || 'Failed to get notification preferences');
    }
  }

  /**
   * Update user notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      // Validate preferences object
      if (!preferences || typeof preferences !== 'object') {
        throw new Error('Invalid preferences object provided');
      }

      // Ensure all required properties exist with default values
      const validatedPreferences: NotificationPreferences = {
        orderUpdates: preferences.orderUpdates ?? true,
        promotions: preferences.promotions ?? true,
        newsletter: preferences.newsletter ?? true,
      };

      console.log('NotificationService: Updating notification preferences for user:', userId, validatedPreferences);

      await AsyncStorage.setItem(
        `${this.PREFERENCES_KEY}_${userId}`,
        JSON.stringify(validatedPreferences)
      );

      console.log('NotificationService: Preferences updated successfully');
    } catch (error: any) {
      console.error('NotificationService: Error updating preferences:', error);
      throw new Error(error.message || 'Failed to update notification preferences');
    }
  }

  /**
   * Register device for push notifications
   */
  async registerPushToken(token: PushNotificationToken): Promise<void> {
    try {
      console.log('NotificationService: Registering push token for user:', token.userId);
      
      if (Platform.OS === 'web') {
        console.log('NotificationService: Push notifications not supported on web');
        return;
      }

      // Store token locally (in a real app, you'd send this to your server)
      const tokensKey = `@onolo_push_tokens_${token.userId}`;
      const existingTokensStr = await AsyncStorage.getItem(tokensKey);
      const existingTokens: PushNotificationToken[] = existingTokensStr 
        ? JSON.parse(existingTokensStr) 
        : [];
      
      // Remove existing token for this platform if it exists
      const filteredTokens = existingTokens.filter(t => t.platform !== token.platform);
      const updatedTokens = [...filteredTokens, token];
      
      await AsyncStorage.setItem(tokensKey, JSON.stringify(updatedTokens));
      
      console.log('NotificationService: Push token registered successfully');
    } catch (error: any) {
      console.error('NotificationService: Error registering push token:', error);
      throw new Error(error.message || 'Failed to register push token');
    }
  }

  /**
   * Unregister device from push notifications
   */
  async unregisterPushToken(userId: string, token: string): Promise<void> {
    try {
      console.log('NotificationService: Unregistering push token for user:', userId);
      
      const tokensKey = `@onolo_push_tokens_${userId}`;
      const existingTokensStr = await AsyncStorage.getItem(tokensKey);
      
      if (existingTokensStr) {
        const existingTokens: PushNotificationToken[] = JSON.parse(existingTokensStr);
        const filteredTokens = existingTokens.filter(t => t.token !== token);
        
        await AsyncStorage.setItem(tokensKey, JSON.stringify(filteredTokens));
      }
      
      console.log('NotificationService: Push token unregistered successfully');
    } catch (error: any) {
      console.error('NotificationService: Error unregistering push token:', error);
      throw new Error(error.message || 'Failed to unregister push token');
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(request: NotificationRequest): Promise<boolean> {
    try {
      console.log('NotificationService: Sending notification:', request);
      
      // Get user settings and preferences
      const settings = await this.getNotificationSettings(request.userId);
      const preferences = await this.getNotificationPreferences(request.userId);
      
      // Check if notification type is enabled
      // This is a simplified check - in a real app you'd have more sophisticated logic
      if (request.data?.type === 'promotion' && !preferences.promotions) {
        console.log('NotificationService: Promotion notifications disabled for user');
        return false;
      }
      
      if (request.data?.type === 'newsletter' && !preferences.newsletter) {
        console.log('NotificationService: Newsletter notifications disabled for user');
        return false;
      }
      
      let notificationSent = false;
      
      // Send push notification if enabled and channel requested
      if (settings.push && request.channels.includes('push') && Platform.OS !== 'web') {
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: request.title,
              body: request.body,
              data: request.data || {},
            },
            trigger: null, // Send immediately
          });
          notificationSent = true;
          console.log('NotificationService: Push notification sent');
        } catch (error) {
          console.error('NotificationService: Error sending push notification:', error);
        }
      }
      
      // In a real app, you would also handle email and SMS here
      // For now, we'll just log them
      if (settings.email && request.channels.includes('email')) {
        console.log('NotificationService: Email notification would be sent to user');
        notificationSent = true;
      }
      
      if (settings.sms && request.channels.includes('sms')) {
        console.log('NotificationService: SMS notification would be sent to user');
        notificationSent = true;
      }
      
      // Store notification in history
      await this.addToHistory(request, notificationSent ? 'sent' : 'failed');
      
      return notificationSent;
    } catch (error: any) {
      console.error('NotificationService: Error sending notification:', error);
      
      // Store failed notification in history
      await this.addToHistory(request, 'failed').catch(console.error);
      
      return false;
    }
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(userId: string, limit: number = 50): Promise<NotificationHistory[]> {
    try {
      console.log('NotificationService: Getting notification history for user:', userId);
      
      const historyStr = await AsyncStorage.getItem(`${this.HISTORY_KEY}_${userId}`);
      
      if (historyStr) {
        const history: NotificationHistory[] = JSON.parse(historyStr);
        
        // Sort by creation date (newest first) and apply limit
        const sortedHistory = history
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
        
        console.log(`NotificationService: Found ${sortedHistory.length} notifications in history`);
        return sortedHistory;
      }
      
      return [];
    } catch (error: any) {
      console.error('NotificationService: Error getting notification history:', error);
      return [];
    }
  }

  /**
   * Request push notification permissions
   */
  async requestPushPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('NotificationService: Push notifications not supported on web');
        return false;
      }

      console.log('NotificationService: Requesting push notification permissions');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      console.log('NotificationService: Push permissions granted:', granted);
      
      return granted;
    } catch (error: any) {
      console.error('NotificationService: Error requesting push permissions:', error);
      return false;
    }
  }

  /**
   * Get push notification token
   */
  async getPushToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        console.log('NotificationService: Push tokens not available on web');
        return null;
      }

      console.log('NotificationService: Getting push notification token');

      // For Expo Go, we don't need to specify projectId
      // For production builds, you would need to configure this properly
      const token = await Notifications.getExpoPushTokenAsync();

      console.log('NotificationService: Push token obtained');
      return token.data;
    } catch (error: any) {
      console.error('NotificationService: Error getting push token:', error);
      return null;
    }
  }

  /**
   * Add notification to history
   * @private
   */
  private async addToHistory(
    request: NotificationRequest, 
    status: 'sent' | 'failed' | 'pending'
  ): Promise<void> {
    try {
      const historyKey = `${this.HISTORY_KEY}_${request.userId}`;
      const existingHistoryStr = await AsyncStorage.getItem(historyKey);
      const existingHistory: NotificationHistory[] = existingHistoryStr 
        ? JSON.parse(existingHistoryStr) 
        : [];
      
      const notification: NotificationHistory = {
        id: `notification_${Date.now()}`,
        userId: request.userId,
        title: request.title,
        body: request.body,
        channels: request.channels,
        status,
        createdAt: new Date().toISOString(),
        sentAt: status === 'sent' ? new Date().toISOString() : undefined,
      };
      
      // Keep only last 100 notifications
      const updatedHistory = [notification, ...existingHistory].slice(0, 100);
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('NotificationService: Error adding to history:', error);
      // Don't throw error for history operations
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();