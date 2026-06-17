// ============================================================================
// SmartStudy AI Mobile — Zustand Store
// Global state management for auth, flashcards, sync status
// ============================================================================

import { create } from 'zustand';
import type { User, DashboardStats, Flashcard } from '@smartstudy/shared';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;

  // Dashboard
  stats: DashboardStats | null;
  setStats: (stats: DashboardStats | null) => void;

  // Flashcards
  dueCards: Flashcard[];
  setDueCards: (cards: Flashcard[]) => void;

  // Connectivity & sync
  isOnline: boolean;
  setOnline: (online: boolean) => void;
  pendingSyncCount: number;
  setPendingSyncCount: (count: number) => void;

  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  reminderHour: number;
  setReminderHour: (hour: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Dashboard
  stats: null,
  setStats: (stats) => set({ stats }),

  // Flashcards
  dueCards: [],
  setDueCards: (cards) => set({ dueCards: cards }),

  // Connectivity
  isOnline: true,
  setOnline: (online) => set({ isOnline: online }),
  pendingSyncCount: 0,
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),

  // Notifications
  notificationsEnabled: true,
  setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
  reminderHour: 19,
  setReminderHour: (hour) => set({ reminderHour: hour }),
}));
