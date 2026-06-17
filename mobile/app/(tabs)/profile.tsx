// ============================================================================
// SmartStudy AI Mobile — Profile & Settings Screen
// Sync status, badges, settings, logout
// ============================================================================

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, sharedStyles } from '@/constants/theme';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { syncAll } from '@/lib/offline-db';
import { scheduleDailyReminder, cancelDailyReminder } from '@/lib/notifications';

export default function ProfileScreen() {
  const router = useRouter();
  const { 
    user, 
    stats, 
    isOnline, 
    pendingSyncCount,
    setPendingSyncCount,
    notificationsEnabled,
    setNotificationsEnabled,
    setUser
  } = useAppStore();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Hors-ligne', 'Veuillez vous connecter à Internet pour synchroniser.');
      return;
    }
    
    setSyncing(true);
    try {
      const result = await syncAll();
      setPendingSyncCount(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Succès', `${result.reviews} révisions synchronisées.`);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erreur', 'La synchronisation a échoué.');
    } finally {
      setSyncing(false);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      await scheduleDailyReminder(19, 0);
    } else {
      await cancelDailyReminder();
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Déconnexion', 
          style: 'destructive',
          onPress: async () => {
            await api.auth.logout();
            setUser(null);
            router.replace('/(auth)/login');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <ScrollView style={sharedStyles.container} contentContainerStyle={sharedStyles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={sharedStyles.title}>{user?.username || 'Utilisateur'}</Text>
            <Text style={sharedStyles.body}>{user?.email || 'email@example.com'}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Niveau {stats?.level || 1}</Text>
            </View>
          </View>
        </View>

        {/* Sync Status Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synchronisation</Text>
          <View style={styles.card}>
            <View style={styles.syncHeader}>
              <View style={styles.syncStatus}>
                <Ionicons 
                  name={isOnline ? 'cloud-done' : 'cloud-offline'} 
                  size={24} 
                  color={isOnline ? COLORS.success : COLORS.warning} 
                />
                <Text style={styles.syncStatusText}>
                  {isOnline ? 'En ligne' : 'Hors-ligne'}
                </Text>
              </View>
              {pendingSyncCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>{pendingSyncCount} en attente</Text>
                </View>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.syncButton, (!isOnline || syncing) && styles.syncButtonDisabled]}
              onPress={handleSync}
              disabled={!isOnline || syncing}
            >
              <Ionicons name="sync" size={20} color="#FFF" />
              <Text style={styles.syncButtonText}>
                {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={22} color={COLORS.primary} />
                <View>
                  <Text style={styles.settingTitle}>Rappels quotidiens</Text>
                  <Text style={styles.settingSub}>Notification à 19h00</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary }}
                thumbColor="#FFF"
              />
            </View>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="color-palette" size={22} color={COLORS.secondary} />
                <View>
                  <Text style={styles.settingTitle}>Thème de l'application</Text>
                  <Text style={styles.settingSub}>Mode sombre (défaut)</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { marginTop: SPACING.xl }]}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color={COLORS.danger} />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  userInfo: {
    flex: 1,
  },
  levelBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  levelText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  syncStatusText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  pendingBadge: {
    backgroundColor: 'rgba(253, 203, 110, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BORDER_RADIUS.full,
  },
  pendingText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.warning,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  syncButtonDisabled: {
    backgroundColor: COLORS.surfaceLight,
  },
  syncButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: '#FFF',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  settingSub: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 54, // Align with text
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: 'rgba(225, 112, 85, 0.1)',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(225, 112, 85, 0.2)',
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
