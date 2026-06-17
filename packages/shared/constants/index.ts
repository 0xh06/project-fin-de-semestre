// ============================================================================
// SmartStudy AI — Shared constants
// ============================================================================

/** SM-2 quality labels used in flashcard review (0-5 scale) */
export const REVIEW_QUALITY = {
  FORGOT: 0,
  HARD: 2,
  GOOD: 4,
  EASY: 5,
} as const;

export const REVIEW_LABELS: Record<number, string> = {
  0: 'Oublié',
  2: 'Difficile',
  4: 'Bien',
  5: 'Facile',
};

/** Quiz modes */
export const QUIZ_MODES = ['multiple_choice', 'true_false', 'open_ended'] as const;

/** Quiz difficulties */
export const QUIZ_DIFFICULTIES = ['auto', 'easy', 'medium', 'hard'] as const;

/** Supported AI providers */
export const AI_PROVIDERS = ['gemini', 'openai', 'mistral'] as const;

/** XP rewards */
export const XP_REWARDS = {
  FLASHCARD_REVIEW: 5,
  QUIZ_QUESTION_CORRECT: 10,
  QUIZ_PERFECT: 50,
  DOCUMENT_UPLOAD: 15,
  STREAK_DAY: 20,
  CHAT_MESSAGE: 2,
} as const;

/** Colors for the design system (shared between web + mobile) */
export const COLORS = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  secondary: '#00CEC9',
  accent: '#FD79A8',
  success: '#00B894',
  warning: '#FDCB6E',
  danger: '#E17055',
  dark: '#0A0A1A',
  darkCard: '#1A1A2E',
  darkSurface: '#16213E',
  darkBorder: '#2A2A4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0C0',
  textMuted: '#6B6B8D',
} as const;
