import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';

import notificationService, { NotificationData } from '@/handlers/notificationService';
import firebaseService from '@/handlers/firebaseService';
import { useUser } from '@/store/reduxHooks';

/**
 * Hook to manage push notifications throughout the app lifecycle
 * - Initializes notifications when user is logged in
 * - Handles foreground notifications with toasts
 * - Handles notification tap navigation
 * - Cleans up on logout
 */
export const useNotifications = () => {
  const router = useRouter();
  const { userData } = useUser();
  const appState = useRef(AppState.currentState);
  const foregroundListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Handle foreground notifications with toast
  const handleForegroundNotification = useCallback(
    (data: NotificationData) => {
      if (!data) return;

      switch (data.type) {
        case 'message':
          Toast.show({
            type: 'success',
            text1: data.senderName || 'New Message',
            text2: data.messagePreview || 'You have a new message',
            visibilityTime: 4000,
            onPress: () => {
              if (data.threadId) {
                router.push(`/(home)/(messages)/${data.threadId}` as any);
              }
              Toast.hide();
            },
          });
          break;

        case 'order':
          Toast.show({
            type: 'success',
            text1: 'New Order',
            text2: `${data.senderName || 'Someone'} placed an order`,
            visibilityTime: 4000,
            onPress: () => {
              router.push('/(home)/(orders)' as any);
              Toast.hide();
            },
          });
          break;

        case 'order_update':
          Toast.show({
            type: 'success',
            text1: 'Order Update',
            text2: data.messagePreview || 'Your order status has been updated',
            visibilityTime: 4000,
            onPress: () => {
              router.push('/(home)/(orders)' as any);
              Toast.hide();
            },
          });
          break;
      }
    },
    [router]
  );

  // Handle notification tap navigation
  const handleNotificationResponse = useCallback(
    (data: NotificationData) => {
      if (!data) return;

      switch (data.type) {
        case 'message':
          if (data.threadId) {
            router.push(`/(home)/(messages)/${data.threadId}` as any);
          } else {
            router.push('/(home)/(messages)' as any);
          }
          break;

        case 'order':
        case 'order_update':
          router.push('/(home)/(orders)' as any);
          break;
      }
    },
    [router]
  );

  // Initialize notifications when user logs in
  useEffect(() => {
    const initializeNotifications = async () => {
      if (!userData?.uid) return;

      try {
        // Initialize the notification service
        const token = await notificationService.initialize(userData.uid);

        if (token) {
          // Register the token with Firebase via Cloud Function
          await firebaseService.registerPushToken(token, Platform.OS as 'ios' | 'android' | 'web');
          console.log('Push notifications initialized successfully');
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();

    // Set up foreground notification listener
    foregroundListener.current = notificationService.onForegroundNotification(
      handleForegroundNotification
    );

    // Set up notification response listener (tap handling)
    responseListener.current = notificationService.onNotificationResponse(
      handleNotificationResponse
    );

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      // Clean up listeners
      if (foregroundListener.current) {
        Notifications.removeNotificationSubscription(foregroundListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription.remove();
    };
  }, [userData?.uid, handleForegroundNotification, handleNotificationResponse]);

  // Handle app coming to foreground - refresh badge count
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      // Could refresh unread counts here
    }
    appState.current = nextAppState;
  }, []);

  // Cleanup function for logout
  const cleanupNotifications = useCallback(async () => {
    if (userData?.uid) {
      await notificationService.removeTokenFromUser(userData.uid);
    }
    notificationService.cleanup();
    await notificationService.clearAllNotifications();
  }, [userData?.uid]);

  return {
    cleanupNotifications,
    scheduleLocalNotification:
      notificationService.scheduleLocalNotification.bind(notificationService),
    clearAllNotifications: notificationService.clearAllNotifications.bind(notificationService),
    getBadgeCount: notificationService.getBadgeCount.bind(notificationService),
    setBadgeCount: notificationService.setBadgeCount.bind(notificationService),
  };
};

export default useNotifications;
