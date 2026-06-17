// ============================================================================
// SmartStudy AI Mobile — Root Layout
// Initializes fonts, notifications, connectivity, and splash screen
// ============================================================================

import { useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/theme';
import {
  registerForPushNotifications,
  scheduleDailyReminder,
  addNotificationResponseListener,
} from '@/lib/notifications';
import { syncAll, isOnline } from '@/lib/offline-db';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { useRouter } from 'expo-router';

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const setUser = useAppStore((s) => s.setUser);
  const setOnline = useAppStore((s) => s.setOnline);

  const [fontsLoaded, fontError] = Font.useFonts({
    Inter: require('../assets/fonts/Inter-Variable.ttf'),
  });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check auth state
      try {
        const user = await api.auth.getCurrentUser();
        setUser(user);
      } catch {
        setUser(null);
      }

      // Check connectivity
      const online = await isOnline();
      setOnline(online);

      // Sync any offline data
      if (online) {
        await syncAll();
      }

      // Setup push notifications
      await registerForPushNotifications();
      await scheduleDailyReminder(19, 0);
    } catch (err) {
      console.warn('Init error:', err);
    }
  };

  // Handle notification deep links
  useEffect(() => {
    const sub = addNotificationResponseListener((screen) => {
      router.push(screen as any);
    });
    return () => sub.remove();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/login"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
