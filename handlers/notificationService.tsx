import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import firebaseService from './firebaseService';

/**
 * NotificationService - Handles push notification registration and management
 *
 * Uses Expo Notifications with Firebase Cloud Messaging (FCM) for:
 * - iOS: APNs via FCM
 * - Android: FCM directly
 * - Web: FCM with VAPID
 */

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false, // We use toast notifications instead
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

export type NotificationData = {
  type: 'message' | 'order' | 'order_update';
  threadId?: string;
  orderId?: string;
  senderId?: string;
  senderName?: string;
  messagePreview?: string;
};

class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service and register for push notifications
   * Call this after user logs in
   */
  async initialize(userId: string): Promise<string | null> {
    try {
      // Request permissions and get token
      const token = await this.registerForPushNotifications();

      if (token && userId) {
        // Save token to user's document in Firestore
        await this.saveTokenToUser(userId, token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();

      return token;
    } catch (error) {
      console.error('Error initializing notification service:', error);
      return null;
    }
  }

  /**
   * Register for push notifications and get the Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Push notifications don't work on simulators/emulators
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }

      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.log('No project ID found for push notifications');
        // Fallback for development - try to get token anyway
        const tokenData = await Notifications.getExpoPushTokenAsync();
        this.expoPushToken = tokenData.data;
        return this.expoPushToken;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = tokenData.data;
      console.log('Expo push token:', this.expoPushToken);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannel();
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Set up Android notification channel for proper notification display
   */
  private async setupAndroidChannel(): Promise<void> {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#87CEFA',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Orders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00FF00',
      sound: 'default',
    });
  }

  /**
   * Save push token to user's Firestore document
   */
  private async saveTokenToUser(userId: string, token: string): Promise<void> {
    try {
      await firebaseService.updateDocument('users', userId, {
        pushTokens: {
          [Platform.OS]: token,
          updatedAt: new Date().toISOString(),
        },
      });
      console.log('Push token saved for user:', userId);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  /**
   * Remove push token from user's document (call on logout)
   */
  async removeTokenFromUser(userId: string): Promise<void> {
    try {
      await firebaseService.updateDocument('users', userId, {
        [`pushTokens.${Platform.OS}`]: null,
      });
      console.log('Push token removed for user:', userId);
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  }

  /**
   * Set up listeners for incoming notifications and notification responses
   */
  private setupNotificationListeners(): void {
    // Clean up existing listeners
    this.cleanup();

    // Listen for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received in foreground:', notification);
      // The notification handler above prevents showing the system notification
      // We handle it via toast in the app instead
      this.handleForegroundNotification(notification);
    });

    // Listen for user interactions with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification received while app is in foreground
   * This is where we can trigger toast notifications
   */
  private handleForegroundNotification(
    notification: Notifications.Notification
  ): NotificationData | null {
    const data = notification.request.content.data as NotificationData;

    // Return the data so the app can show a toast
    return data;
  }

  /**
   * Handle user tapping on a notification
   * This should navigate to the appropriate screen
   */
  private handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): NotificationData | null {
    const data = response.notification.request.content.data as NotificationData;

    // Return the data so the app can navigate
    return data;
  }

  /**
   * Get the current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Set callback for foreground notifications
   */
  onForegroundNotification(callback: (data: NotificationData) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as NotificationData;
      callback(data);
    });
  }

  /**
   * Set callback for notification tap responses
   */
  onNotificationResponse(callback: (data: NotificationData) => void): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      callback(data);
    });
  }

  /**
   * Schedule a local notification (for testing or local reminders)
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: NotificationData,
    seconds: number = 1
  ): Promise<string> {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });

    return id;
  }

  /**
   * Get the badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set the badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
    await this.setBadgeCount(0);
  }

  /**
   * Clean up listeners (call on logout or app unmount)
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }
}

const notificationService = NotificationService.getInstance();
export default notificationService;
