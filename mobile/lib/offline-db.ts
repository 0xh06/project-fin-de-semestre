// ============================================================================
// SmartStudy AI Mobile — Offline SQLite Database
// Local cache for flashcards, chat, and documents with sync support
// ============================================================================

import * as SQLite from 'expo-sqlite';
import NetInfo from '@react-native-community/netinfo';
import { api } from './api';

const DB_NAME = 'smartstudy_offline.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await runMigrations(db);
  }
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Flashcards cache
    CREATE TABLE IF NOT EXISTS flashcards_cache (
      id          INTEGER PRIMARY KEY,
      deck_id     INTEGER NOT NULL,
      front       TEXT NOT NULL,
      back        TEXT NOT NULL,
      difficulty  REAL DEFAULT 2.5,
      interval_days INTEGER DEFAULT 1,
      repetitions INTEGER DEFAULT 0,
      next_review TEXT,
      synced      INTEGER DEFAULT 1,
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    -- Pending reviews (queued offline)
    CREATE TABLE IF NOT EXISTS pending_reviews (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id     INTEGER NOT NULL,
      quality     INTEGER NOT NULL,
      reviewed_at TEXT DEFAULT (datetime('now')),
      synced      INTEGER DEFAULT 0
    );

    -- Chat messages cache
    CREATE TABLE IF NOT EXISTS chat_cache (
      id          INTEGER PRIMARY KEY,
      session_id  INTEGER,
      role        TEXT NOT NULL,
      content     TEXT NOT NULL,
      tokens      INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now')),
      synced      INTEGER DEFAULT 1
    );

    -- Documents cache (metadata only)
    CREATE TABLE IF NOT EXISTS documents_cache (
      id              INTEGER PRIMARY KEY,
      title           TEXT NOT NULL,
      summary_ai      TEXT,
      tags            TEXT,
      page_count      INTEGER DEFAULT 0,
      file_size_bytes INTEGER DEFAULT 0,
      imported_at     TEXT,
      synced          INTEGER DEFAULT 1
    );

    -- Sync log
    CREATE TABLE IF NOT EXISTS sync_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name  TEXT NOT NULL,
      record_id   INTEGER NOT NULL,
      action      TEXT NOT NULL, -- 'create', 'update', 'delete'
      payload     TEXT,
      created_at  TEXT DEFAULT (datetime('now')),
      synced      INTEGER DEFAULT 0
    );
  `);
}

// --- Flashcards offline ---

export async function cacheFlashcards(
  cards: Array<{
    id: number;
    deck_id: number;
    front: string;
    back: string;
    difficulty: number;
    interval_days: number;
    repetitions: number;
    next_review: string;
  }>
): Promise<void> {
  const database = await getDatabase();
  for (const card of cards) {
    await database.runAsync(
      `INSERT OR REPLACE INTO flashcards_cache
       (id, deck_id, front, back, difficulty, interval_days, repetitions, next_review, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [card.id, card.deck_id, card.front, card.back, card.difficulty,
       card.interval_days, card.repetitions, card.next_review]
    );
  }
}

export async function getCachedDueFlashcards(): Promise<any[]> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  return database.getAllAsync(
    `SELECT * FROM flashcards_cache WHERE next_review <= ? OR next_review IS NULL ORDER BY next_review ASC`,
    [now]
  );
}

export async function queueReview(cardId: number, quality: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO pending_reviews (card_id, quality) VALUES (?, ?)`,
    [cardId, quality]
  );
}

// --- Sync engine ---

export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return false;
  }
}

export async function syncPendingReviews(): Promise<number> {
  if (!(await isOnline())) return 0;

  const database = await getDatabase();
  const pending = await database.getAllAsync<{
    id: number;
    card_id: number;
    quality: number;
  }>(`SELECT * FROM pending_reviews WHERE synced = 0`);

  let synced = 0;
  for (const review of pending) {
    try {
      await api.flashcards.review({
        card_id: review.card_id,
        quality: review.quality,
      });
      await database.runAsync(
        `UPDATE pending_reviews SET synced = 1 WHERE id = ?`,
        [review.id]
      );
      synced++;
    } catch (err) {
      console.warn('[Sync] Failed to sync review', review.id, err);
    }
  }

  return synced;
}

export async function syncAll(): Promise<{ reviews: number }> {
  const reviews = await syncPendingReviews();
  return { reviews };
}
