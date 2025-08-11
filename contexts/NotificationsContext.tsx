import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform } from 'react-native';
import { notificationService } from '../services/notifications/NotificationService';
import { useAuth } from './AuthContext';
import type {
  NotificationSettings,
  NotificationPreferences
} from '../services/interfaces/INotificationService';

// Debounce utility
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Notifications Context Types
interface NotificationsContextType {
  notificationSettings: NotificationSettings;
  notificationPreferences: NotificationPreferences;
  isLoading: boolean;
  
  // Notification methods
  updateNotificationSettings: (settings: NotificationSettings) => Promise<void>;
  updateNotificationPreferences: (preferences: NotificationPreferences) => Promise<void>;
  updateBothSettings: (settings: NotificationSettings, preferences: NotificationPreferences) => Promise<void>;
  registerForPushNotifications: () => Promise<boolean>;
  requestPushPermissions: () => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  // State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    sms: true,
    push: true,
  });
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    promotions: true,
    newsletter: true,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Auth context
  const { user, isAuthenticated } = useAuth();

  // Refs for cleanup and optimization
  const isMountedRef = useRef(true);
  const lastUpdateRef = useRef<{ settings?: NotificationSettings; preferences?: NotificationPreferences }>({});

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load settings when user changes
  useEffect(() => {
    if (user && isAuthenticated && !user.isGuest) {
      loadSettings();
    } else {
      // Reset to defaults for guest users or when logged out
      setNotificationSettings({
        email: true,
        sms: true,
        push: true,
      });
      setNotificationPreferences({
        orderUpdates: true,
        promotions: true,
        newsletter: true,
      });
    }
  }, [user, isAuthenticated]);

  // Load settings from service
  const loadSettings = useCallback(async () => {
    if (!user || user.isGuest) return;

    try {
      setIsLoading(true);
      console.log('NotificationsContext: Loading settings for user:', user.id);
      
      const [settings, preferences] = await Promise.all([
        notificationService.getNotificationSettings(user.id),
        notificationService.getNotificationPreferences(user.id),
      ]);
      
      if (isMountedRef.current) {
        setNotificationSettings(settings);
        setNotificationPreferences(preferences);
        console.log('NotificationsContext: Settings loaded successfully');
      }
    } catch (error) {
      console.error('NotificationsContext: Error loading settings:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Notification methods
  const updateNotificationSettings = useCallback(async (settings: NotificationSettings): Promise<void> => {
    if (!user || user.isGuest) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('NotificationsContext: Updating notification settings:', settings);
      
      await notificationService.updateNotificationSettings(user.id, settings);
      
      if (isMountedRef.current) {
        setNotificationSettings(settings);
        console.log('NotificationsContext: Notification settings updated successfully');
      }
    } catch (error) {
      console.error('NotificationsContext: Error updating notification settings:', error);
      throw error;
    }
  }, [user]);

  const updateNotificationPreferences = useCallback(async (preferences: NotificationPreferences): Promise<void> => {
    if (!user || user.isGuest) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('NotificationsContext: Updating notification preferences:', preferences);
      
      await notificationService.updateNotificationPreferences(user.id, preferences);
      
      if (isMountedRef.current) {
        setNotificationPreferences(preferences);
        console.log('NotificationsContext: Notification preferences updated successfully');
      }
    } catch (error) {
      console.error('NotificationsContext: Error updating notification preferences:', error);
      throw error;
    }
  }, [user]);

  // Debounced update function to prevent excessive API calls
  const debouncedUpdateBoth = useDebounce(async (
    settings: NotificationSettings,
    preferences: NotificationPreferences
  ) => {
    if (!user || user.isGuest) return;

    try {
      console.log('NotificationsContext: Debounced update - saving settings and preferences');

      await Promise.all([
        notificationService.updateNotificationSettings(user.id, settings),
        notificationService.updateNotificationPreferences(user.id, preferences),
      ]);

      console.log('NotificationsContext: Debounced update completed successfully');
    } catch (error) {
      console.error('NotificationsContext: Error in debounced update:', error);
    }
  }, 1000); // 1 second debounce

  const updateBothSettings = useCallback(async (
    settings?: NotificationSettings,
    preferences?: NotificationPreferences
  ): Promise<void> => {
    if (!user || user.isGuest) {
      throw new Error('User not authenticated');
    }

    try {
      // Validate and provide defaults for settings and preferences
      const validatedSettings: NotificationSettings = settings ? {
        email: settings.email ?? true,
        sms: settings.sms ?? true,
        push: settings.push ?? (Platform.OS !== 'web'),
      } : {
        email: true,
        sms: true,
        push: Platform.OS !== 'web',
      };

      const validatedPreferences: NotificationPreferences = preferences ? {
        orderUpdates: preferences.orderUpdates ?? true,
        promotions: preferences.promotions ?? true,
        newsletter: preferences.newsletter ?? false,
      } : {
        orderUpdates: true,
        promotions: true,
        newsletter: false,
      };

      console.log('NotificationsContext: Validated settings:', validatedSettings);
      console.log('NotificationsContext: Validated preferences:', validatedPreferences);

      // Update local state immediately for responsive UI
      if (isMountedRef.current) {
        setNotificationSettings(validatedSettings);
        setNotificationPreferences(validatedPreferences);
        console.log('NotificationsContext: Local state updated immediately');
      }

      // Store current values for comparison
      lastUpdateRef.current = {
        settings: validatedSettings,
        preferences: validatedPreferences
      };

      // Debounce the actual API call
      debouncedUpdateBoth(validatedSettings, validatedPreferences);

    } catch (error) {
      console.error('NotificationsContext: Error updating both settings:', error);
      throw error;
    }
  }, [user, debouncedUpdateBoth]);

  const registerForPushNotifications = useCallback(async (): Promise<boolean> => {
    if (!user || user.isGuest) {
      console.log('NotificationsContext: Cannot register push notifications for guest user');
      return false;
    }

    // Check if push notifications are enabled in settings
    if (!notificationSettings.push) {
      console.log('NotificationsContext: Push notifications disabled in settings');
      return false;
    }

    try {
      console.log('NotificationsContext: Registering for push notifications');

      // Request permissions first
      const hasPermission = await notificationService.requestPushPermissions();
      if (!hasPermission) {
        console.log('NotificationsContext: Push notification permission denied');
        return false;
      }

      // Get push token
      const token = await notificationService.getPushToken();
      if (!token) {
        console.log('NotificationsContext: Failed to get push token');
        return false;
      }

      // Register token
      await notificationService.registerPushToken({
        userId: user.id,
        token,
        platform: 'ios', // This would be determined dynamically in a real app
        createdAt: new Date().toISOString(),
      });

      console.log('NotificationsContext: Push notifications registered successfully');
      return true;
    } catch (error) {
      console.error('NotificationsContext: Error registering for push notifications:', error);
      return false;
    }
  }, [user, notificationSettings.push]);

  const requestPushPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log('NotificationsContext: Requesting push permissions');
      
      const granted = await notificationService.requestPushPermissions();
      
      console.log('NotificationsContext: Push permissions result:', granted);
      return granted;
    } catch (error) {
      console.error('NotificationsContext: Error requesting push permissions:', error);
      return false;
    }
  }, []);

  const refreshSettings = useCallback(async (): Promise<void> => {
    console.log('NotificationsContext: Refreshing settings');
    await loadSettings();
  }, [loadSettings]);

  // Memoize methods separately to prevent unnecessary re-renders
  const methods = useMemo(() => ({
    updateNotificationSettings,
    updateNotificationPreferences,
    updateBothSettings,
    registerForPushNotifications,
    requestPushPermissions,
    refreshSettings,
  }), [
    updateNotificationSettings,
    updateNotificationPreferences,
    updateBothSettings,
    registerForPushNotifications,
    requestPushPermissions,
    refreshSettings,
  ]);

  // Memoize the context value with optimized dependencies
  const value: NotificationsContextType = useMemo(() => ({
    notificationSettings,
    notificationPreferences,
    isLoading,
    ...methods,
  }), [
    notificationSettings,
    notificationPreferences,
    isLoading,
    methods,
  ]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}