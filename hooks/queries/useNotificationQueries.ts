import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../../services/notifications/NotificationService';
import { queryKeys, invalidateQueries } from '../../utils/queryClient';
import type { 
  NotificationSettings, 
  NotificationPreferences,
  PushNotificationToken,
  NotificationRequest 
} from '../../services/interfaces/INotificationService';

// Notification settings query
export const useNotificationSettings = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.notifications.settings(userId),
    queryFn: () => notificationService.getNotificationSettings(userId),
    enabled: !!userId && userId !== 'guest',
    staleTime: 10 * 60 * 1000, // 10 minutes - settings don't change often
  });
};

// Notification preferences query
export const useNotificationPreferences = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(userId),
    queryFn: () => notificationService.getNotificationPreferences(userId),
    enabled: !!userId && userId !== 'guest',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Notification history query
export const useNotificationHistory = (userId: string, limit: number = 50) => {
  return useQuery({
    queryKey: queryKeys.notifications.history(userId, limit),
    queryFn: () => notificationService.getNotificationHistory(userId, limit),
    enabled: !!userId && userId !== 'guest',
    staleTime: 5 * 60 * 1000, // 5 minutes for history
  });
};

// Update notification settings mutation
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, settings }: { userId: string; settings: NotificationSettings }) => 
      notificationService.updateNotificationSettings(userId, settings),
    onSuccess: (_, { userId, settings }) => {
      console.log('Notification settings updated successfully');
      
      // Update settings in cache
      queryClient.setQueryData(
        queryKeys.notifications.settings(userId),
        settings
      );
      
      // Invalidate related queries
      invalidateQueries.notifications(userId);
    },
    onError: (error) => {
      console.error('Update notification settings mutation error:', error);
    },
  });
};

// Update notification preferences mutation
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: NotificationPreferences }) => 
      notificationService.updateNotificationPreferences(userId, preferences),
    onSuccess: (_, { userId, preferences }) => {
      console.log('Notification preferences updated successfully');
      
      // Update preferences in cache
      queryClient.setQueryData(
        queryKeys.notifications.preferences(userId),
        preferences
      );
      
      // Invalidate related queries
      invalidateQueries.notifications(userId);
    },
    onError: (error) => {
      console.error('Update notification preferences mutation error:', error);
    },
  });
};

// Register push token mutation
export const useRegisterPushToken = () => {
  return useMutation({
    mutationFn: (tokenData: PushNotificationToken) => 
      notificationService.registerPushToken(tokenData),
    onSuccess: (_, tokenData) => {
      console.log('Push token registered successfully for user:', tokenData.userId);
    },
    onError: (error) => {
      console.error('Register push token mutation error:', error);
    },
  });
};

// Send notification mutation
export const useSendNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationData: NotificationRequest) => 
      notificationService.sendNotification(notificationData),
    onSuccess: (success, notificationData) => {
      if (success) {
        console.log('Notification sent successfully');
        
        // Invalidate notification history to include new notification
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.notifications.history(notificationData.userId) 
        });
      }
    },
    onError: (error) => {
      console.error('Send notification mutation error:', error);
    },
  });
};

// Request push permissions mutation
export const useRequestPushPermissions = () => {
  return useMutation({
    mutationFn: () => notificationService.requestPushPermissions(),
    onSuccess: (granted) => {
      console.log('Push permissions request result:', granted);
    },
    onError: (error) => {
      console.error('Request push permissions mutation error:', error);
    },
  });
};

// Combined notifications hook for convenience
export const useNotificationsData = (userId: string) => {
  const settingsQuery = useNotificationSettings(userId);
  const preferencesQuery = useNotificationPreferences(userId);
  const historyQuery = useNotificationHistory(userId);
  const updateSettingsMutation = useUpdateNotificationSettings();
  const updatePreferencesMutation = useUpdateNotificationPreferences();
  const registerTokenMutation = useRegisterPushToken();
  const sendNotificationMutation = useSendNotification();
  const requestPermissionsMutation = useRequestPushPermissions();
  
  return {
    // Data
    settings: settingsQuery.data || { email: true, sms: true, push: true },
    preferences: preferencesQuery.data || { orderUpdates: true, promotions: true, newsletter: true },
    history: historyQuery.data || [],
    
    // Loading states
    isLoading: settingsQuery.isLoading || preferencesQuery.isLoading,
    isUpdatingSettings: updateSettingsMutation.isPending,
    isUpdatingPreferences: updatePreferencesMutation.isPending,
    isRegisteringToken: registerTokenMutation.isPending,
    isSending: sendNotificationMutation.isPending,
    isRequestingPermissions: requestPermissionsMutation.isPending,
    
    // Error states
    settingsError: settingsQuery.error,
    preferencesError: preferencesQuery.error,
    historyError: historyQuery.error,
    updateSettingsError: updateSettingsMutation.error,
    updatePreferencesError: updatePreferencesMutation.error,
    
    // Actions
    updateSettings: (settings: NotificationSettings) => 
      updateSettingsMutation.mutateAsync({ userId, settings }),
    updatePreferences: (preferences: NotificationPreferences) => 
      updatePreferencesMutation.mutateAsync({ userId, preferences }),
    updateBoth: async (settings: NotificationSettings, preferences: NotificationPreferences) => {
      await Promise.all([
        updateSettingsMutation.mutateAsync({ userId, settings }),
        updatePreferencesMutation.mutateAsync({ userId, preferences })
      ]);
    },
    registerPushToken: registerTokenMutation.mutateAsync,
    sendNotification: sendNotificationMutation.mutateAsync,
    requestPushPermissions: requestPermissionsMutation.mutateAsync,
    
    // Refetch functions
    refetchSettings: settingsQuery.refetch,
    refetchPreferences: preferencesQuery.refetch,
    refetchHistory: historyQuery.refetch,
    refetchAll: () => {
      settingsQuery.refetch();
      preferencesQuery.refetch();
      historyQuery.refetch();
    },
  };
};