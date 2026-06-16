-- ============================================================================
--  SmartStudy AI — Schéma de base de données SQLite (Mis à jour)
-- ============================================================================

-- Activation des clés étrangères et optimisation des écritures
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ---------------------------------------------------------------------------
-- 1. Utilisateurs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    UNIQUE NOT NULL,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    settings_json TEXT    DEFAULT '{}'
);

-- ---------------------------------------------------------------------------
-- 2. Documents PDF
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    filename     TEXT    NOT NULL,
    content_text TEXT,
    summary_ai   TEXT,
    tags         TEXT,
    uploaded_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);

-- ---------------------------------------------------------------------------
-- 3. Flashcards (Répétition espacée)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flashcards (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id   INTEGER,
    user_id       INTEGER NOT NULL,
    front         TEXT    NOT NULL,
    back          TEXT    NOT NULL,
    difficulty    REAL    DEFAULT 2.5,
    next_review   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    interval_days INTEGER DEFAULT 1,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_flashcards_user   ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_doc    ON flashcards(document_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_review ON flashcards(next_review);

-- ---------------------------------------------------------------------------
-- 4. Sessions de Quiz
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    score       REAL    DEFAULT 0.0,
    total       INTEGER DEFAULT 0,
    started_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);

-- ---------------------------------------------------------------------------
-- 5. Réponses au Quiz
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quiz_answers (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   INTEGER NOT NULL,
    flashcard_id INTEGER NOT NULL,
    user_answer  TEXT,
    is_correct   INTEGER DEFAULT 0,
    FOREIGN KEY (session_id)   REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id)    ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_session ON quiz_answers(session_id);

-- ---------------------------------------------------------------------------
-- 6. Messages du Chat IA
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    role        TEXT    NOT NULL CHECK(role IN ('user', 'assistant')),
    content     TEXT    NOT NULL,
    model_used  TEXT,
    tokens_used INTEGER DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- ---------------------------------------------------------------------------
-- 7. Sessions d'étude (Gamification & Suivi)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_sessions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    xp_earned        INTEGER DEFAULT 0,
    streak_day       INTEGER DEFAULT 1,
    created_at       TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);

-- ---------------------------------------------------------------------------
-- 8. Cartes Mentales (Mind Maps)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mind_maps (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    document_id INTEGER,
    nodes_json  TEXT    NOT NULL DEFAULT '{}',
    created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_mind_maps_user ON mind_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_maps_doc  ON mind_maps(document_id);
