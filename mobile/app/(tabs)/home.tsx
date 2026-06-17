// ============================================================================
// SmartStudy AI Mobile — Home Screen (Dashboard)
// Streak, daily cards, quick quiz, XP progress, weekly activity
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, sharedStyles } from '@/constants/theme';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { DashboardStats } from '@smartstudy/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { stats, setStats, isOnline, user } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.gamification.getDashboard();
      setStats(data);
    } catch (err) {
      console.warn('Dashboard load error:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const xpProgress = stats
    ? (stats.xp_total / (stats.xp_total + stats.xp_to_next_level)) * 100
    : 0;

  const navigateTo = (path: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path as any);
  };

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <ScrollView
        style={sharedStyles.container}
        contentContainerStyle={sharedStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour 👋</Text>
            <Text style={sharedStyles.heroTitle}>{user?.username || 'Étudiant'}</Text>
          </View>
          {!isOnline && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={14} color={COLORS.warning} />
              <Text style={styles.offlineText}>Hors-ligne</Text>
            </View>
          )}
        </View>

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakFlame}>
            <Text style={styles.flameEmoji}>🔥</Text>
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{stats?.streak_days ?? 0}</Text>
            <Text style={styles.streakLabel}>jours de streak</Text>
          </View>
          <View style={styles.streakDots}>
            {[...Array(7)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  i < (stats?.streak_days ?? 0) % 7 && styles.streakDotActive,
                ]}
              />
            ))}
          </View>
          <Text style={sharedStyles.caption}>
            Record : {stats?.longest_streak ?? 0} jours
          </Text>
        </View>

        {/* XP Progress */}
        <View style={[sharedStyles.card, { marginTop: SPACING.lg }]}>
          <View style={sharedStyles.rowBetween}>
            <Text style={sharedStyles.subtitle}>Niveau {stats?.level ?? 1}</Text>
            <View style={sharedStyles.badge}>
              <Text style={sharedStyles.badgeText}>⭐ {stats?.xp_total ?? 0} XP</Text>
            </View>
          </View>
          <View style={styles.xpBarContainer}>
            <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={sharedStyles.caption}>
            {stats?.xp_to_next_level ?? 0} XP restants pour le prochain niveau
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={24} color={COLORS.secondary} />
            <Text style={styles.statNumber}>{stats?.documents_count ?? 0}</Text>
            <Text style={sharedStyles.caption}>Documents</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flash" size={24} color={COLORS.warning} />
            <Text style={styles.statNumber}>
              {stats?.flashcards_mastered ?? 0}/{stats?.flashcards_total ?? 0}
            </Text>
            <Text style={sharedStyles.caption}>Flashcards</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats?.quizzes_completed ?? 0}</Text>
            <Text style={sharedStyles.caption}>Quiz</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={COLORS.accent} />
            <Text style={styles.statNumber}>{stats?.study_time_minutes ?? 0}</Text>
            <Text style={sharedStyles.caption}>Minutes</Text>
          </View>
        </View>

        {/* Weekly XP Chart */}
        <View style={[sharedStyles.card, { marginTop: SPACING.lg }]}>
          <Text style={sharedStyles.subtitle}>Activité de la semaine</Text>
          <View style={styles.weeklyChart}>
            {(stats?.weekly_xp ?? [0, 0, 0, 0, 0, 0, 0]).map((xp, i) => {
              const maxXP = Math.max(...(stats?.weekly_xp ?? [1]), 1);
              const height = (xp / maxXP) * 100;
              const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
              return (
                <View key={i} style={styles.chartColumn}>
                  <View style={styles.chartBarWrapper}>
                    <View
                      style={[
                        styles.chartBar,
                        {
                          height: `${Math.max(height, 4)}%`,
                          backgroundColor: i === 6 ? COLORS.primary : COLORS.primaryLight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.chartLabel}>{days[i]}</Text>
                  <Text style={styles.chartValue}>{xp}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[sharedStyles.subtitle, { marginTop: SPACING.xl, marginBottom: SPACING.md }]}>
          Actions rapides
        </Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: COLORS.primary }]}
            onPress={() => navigateTo('/(tabs)/study')}
            activeOpacity={0.8}
          >
            <Ionicons name="flash" size={28} color="#FFF" />
            <Text style={styles.quickActionText}>Réviser</Text>
            <Text style={styles.quickActionSub}>Flashcards du jour</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: COLORS.secondary }]}
            onPress={() => navigateTo('/(tabs)/chat')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles" size={28} color="#FFF" />
            <Text style={styles.quickActionText}>Chat IA</Text>
            <Text style={styles.quickActionSub}>Poser une question</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: COLORS.accent }]}
            onPress={() => navigateTo('/(tabs)/library')}
            activeOpacity={0.8}
          >
            <Ionicons name="scan" size={28} color="#FFF" />
            <Text style={styles.quickActionText}>Scanner</Text>
            <Text style={styles.quickActionSub}>Ajouter un document</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(253, 203, 110, 0.15)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  offlineText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontWeight: '600',
  },

  // Streak
  streakCard: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.glow,
  },
  streakFlame: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(253, 203, 110, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  flameEmoji: {
    fontSize: 32,
  },
  streakInfo: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 52,
  },
  streakLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  streakDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  streakDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.border,
  },
  streakDotActive: {
    backgroundColor: COLORS.warning,
    ...SHADOWS.subtle,
  },

  // XP bar
  xpBarContainer: {
    height: 8,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    marginVertical: SPACING.sm,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.md) / 2 - 1,
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  statNumber: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Weekly chart
  weeklyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: BORDER_RADIUS.sm,
    minHeight: 4,
  },
  chartLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
  chartValue: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Quick actions
  quickActions: {
    gap: SPACING.md,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    ...SHADOWS.card,
  },
  quickActionText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
  },
  quickActionSub: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.7)',
  },
});
