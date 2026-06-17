// ============================================================================
// SmartStudy AI Mobile — Push Notifications Service
// Daily study reminders via Expo Notifications
// ============================================================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior (show even when foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Request notification permissions */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permission not granted');
    return null;
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('study-reminders', {
      name: 'Rappels de révision',
      description: 'Rappels quotidiens pour réviser vos flashcards',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6C5CE7',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('achievements', {
      name: 'Succès et badges',
      description: 'Notifications de nouveaux badges et succès',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#00CEC9',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

/** Schedule daily study reminder */
export async function scheduleDailyReminder(
  hour: number = 19,
  minute: number = 0
): Promise<string> {
  // Cancel any existing daily reminder first
  await cancelDailyReminder();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '📚 Temps de réviser !',
      body: 'Vos flashcards du jour vous attendent. Maintenez votre streak !',
      data: { screen: '/(tabs)/study' },
      sound: 'default',
      ...(Platform.OS === 'android' && { channelId: 'study-reminders' }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return id;
}

/** Cancel daily reminder */
export async function cancelDailyReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.content.data?.screen === '/(tabs)/study') {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
  }
}

/** Send an immediate local notification (e.g. achievement unlocked) */
export async function sendAchievementNotification(
  title: string,
  body: string
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `🏆 ${title}`,
      body,
      data: { screen: '/(tabs)/profile' },
      ...(Platform.OS === 'android' && { channelId: 'achievements' }),
    },
    trigger: null, // Immediate
  });
}

/** Add notification response listener (deep link into the app) */
export function addNotificationResponseListener(
  callback: (screen: string) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const screen = response.notification.request.content.data?.screen;
    if (screen && typeof screen === 'string') {
      callback(screen);
    }
  });
}
