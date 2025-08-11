import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Handle notification responses (when user taps on notification)
export const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
  const data = response.notification.request.content.data;
  
  if (__DEV__) {
    console.log('Notification tapped:', data);
  }
  
  // Handle different notification types
  switch (data?.type) {
    case 'order_update':
      // Navigate to order details
      // router.push(`/order/${data.orderId}`);
      break;
    case 'new_message':
      // Navigate to chat
      // router.push('/(tabs)/chat');
      break;
    default:
      // Default action
      break;
  }
};

// Set up notification listeners
export const setupNotificationListeners = () => {
  // Handle notifications received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    if (__DEV__) {
      console.log('Notification received in foreground:', notification);
    }
  });

  // Handle notification responses (user tapped notification)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
};

// Send local notification (for testing)
export const sendLocalNotification = async (title: string, body: string, data?: any) => {
  if (Platform.OS === 'web') {
    console.log('Local notifications not supported on web');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Send immediately
  });
};