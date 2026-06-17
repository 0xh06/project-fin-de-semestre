// ============================================================================
// SmartStudy AI Mobile — Study Screen (Flashcards)
// Tinder-like swipeable flashcards (Reanimated & Gesture Handler)
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS, SHADOWS, sharedStyles } from '@/constants/theme';
import { getCachedDueFlashcards, queueReview } from '@/lib/offline-db';
import { useAppStore } from '@/lib/store';
import type { Flashcard } from '@smartstudy/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export default function StudyScreen() {
  const { dueCards, setDueCards } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const cards = await getCachedDueFlashcards();
      setDueCards(cards);
    } catch (err) {
      console.warn('Failed to load flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCard = dueCards[0] as Flashcard | undefined;

  const handleReview = useCallback(
    async (quality: number) => {
      if (!currentCard) return;

      // Haptic feedback based on quality
      if (quality >= 4) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      await queueReview(currentCard.id, quality);
      setDueCards(dueCards.slice(1));
      setShowAnswer(false);
      
      // Reset animation values
      translateX.value = 0;
      translateY.value = 0;
      rotation.value = 0;
    },
    [currentCard, dueCards, setDueCards, translateX, translateY, rotation]
  );

  const panGesture = Gesture.Pan()
    .enabled(showAnswer) // Only swipeable when answer is shown
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
      rotation.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, SCREEN_WIDTH / 2],
        [-15, 15],
        Extrapolate.CLAMP
      );
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe Right (Easy/Good)
        translateX.value = withSpring(SCREEN_WIDTH);
        runOnJS(handleReview)(4); // Quality 4 = Good
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe Left (Hard/Forgot)
        translateX.value = withSpring(-SCREEN_WIDTH);
        runOnJS(handleReview)(0); // Quality 0 = Forgot
      } else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (!showAnswer) {
      runOnJS(setShowAnswer)(true);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  });

  const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotateZ: `${rotation.value}deg` },
      ],
    };
  });

  if (loading) {
    return (
      <SafeAreaView style={sharedStyles.safeArea}>
        <View style={[sharedStyles.container, sharedStyles.center]}>
          <Text style={sharedStyles.body}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dueCards.length === 0) {
    return (
      <SafeAreaView style={sharedStyles.safeArea}>
        <View style={[sharedStyles.container, sharedStyles.center, { padding: SPACING.xl }]}>
          <View style={styles.doneCircle}>
            <Ionicons name="checkmark-done" size={48} color={COLORS.success} />
          </View>
          <Text style={[sharedStyles.title, { textAlign: 'center', marginBottom: SPACING.sm }]}>
            Félicitations !
          </Text>
          <Text style={[sharedStyles.body, { textAlign: 'center' }]}>
            Vous avez révisé toutes vos cartes pour aujourd'hui.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <View style={styles.header}>
        <Text style={sharedStyles.subtitle}>Révision</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{dueCards.length} restantes</Text>
        </View>
      </View>

      <View style={styles.cardContainer}>
        {/* Next Card (Background) */}
        {dueCards.length > 1 && (
          <View style={[styles.card, styles.cardBackground]}>
            <Text style={styles.cardText} numberOfLines={3}>
              {dueCards[1].front}
            </Text>
          </View>
        )}

        {/* Current Card (Foreground) */}
        {currentCard && (
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={[styles.card, styles.cardForeground, animatedCardStyle]}>
              <View style={styles.cardContent}>
                <Text style={styles.cardFront}>{currentCard.front}</Text>
                {showAnswer && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.cardBack}>{currentCard.back}</Text>
                  </>
                )}
              </View>

              {!showAnswer ? (
                <View style={styles.instruction}>
                  <Ionicons name="hand-right-outline" size={20} color={COLORS.textMuted} />
                  <Text style={styles.instructionText}>Touchez pour voir la réponse</Text>
                </View>
              ) : (
                <View style={styles.swipeIndicators}>
                  <View style={styles.swipeIndicatorLeft}>
                    <Ionicons name="arrow-back" size={16} color={COLORS.danger} />
                    <Text style={[styles.swipeText, { color: COLORS.danger }]}>Oublié</Text>
                  </View>
                  <View style={styles.swipeIndicatorRight}>
                    <Text style={[styles.swipeText, { color: COLORS.success }]}>Facile</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.success} />
                  </View>
                </View>
              )}
            </Animated.View>
          </GestureDetector>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  badge: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  doneCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 184, 148, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - SPACING.lg * 2,
    height: (SCREEN_WIDTH - SPACING.lg * 2) * 1.4,
    backgroundColor: COLORS.cardElevated,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.glow,
  },
  cardBackground: {
    transform: [{ scale: 0.95 }, { translateY: 20 }],
    opacity: 0.5,
  },
  cardForeground: {
    zIndex: 10,
    justifyContent: 'space-between',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardFront: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  cardBack: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.xl,
  },
  cardText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  instruction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.lg,
  },
  instructionText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  swipeIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.lg,
  },
  swipeIndicatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  swipeIndicatorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  swipeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});
