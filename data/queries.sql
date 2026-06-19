-- ============================================================================
-- SmartStudy AI — Requêtes SQL Courantes (CRUD)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. USERS
-- ---------------------------------------------------------------------------
-- Inscription
INSERT INTO users (email, password_hash, settings_json) 
VALUES ('etudiant@test.com', 'hash_ici', '{"theme": "dark"}');

-- Authentification
SELECT id, password_hash FROM users WHERE email = 'etudiant@test.com';

-- Mise à jour des réglages
UPDATE users SET settings_json = '{"theme": "light"}' WHERE id = 1;

-- ---------------------------------------------------------------------------
-- 2. DOCUMENTS
-- ---------------------------------------------------------------------------
-- Ajouter un PDF
INSERT INTO documents (user_id, filename, content_text, tags) 
VALUES (1, 'chapitre_1.pdf', 'Contenu brut...', 'chimie,chap1');

-- Lister les documents d'un utilisateur
SELECT id, filename, uploaded_at FROM documents WHERE user_id = 1 ORDER BY uploaded_at DESC;

-- Enregistrer le résumé IA
UPDATE documents SET summary_ai = 'Ce chapitre parle de...' WHERE id = 1;

-- ---------------------------------------------------------------------------
-- 3. FLASHCARDS
-- ---------------------------------------------------------------------------
-- Ajouter une flashcard liée à un document
INSERT INTO flashcards (user_id, document_id, front, back) 
VALUES (1, 1, 'Qu''est-ce qu''une mole ?', '6.022 × 10^23 entités');

-- Récupérer les flashcards à réviser aujourd'hui
SELECT id, front, back, difficulty, interval_days 
FROM flashcards 
WHERE user_id = 1 AND next_review <= CURRENT_TIMESTAMP;

-- Mettre à jour l'algorithme après une révision (ex: succès, intervalle de 3 jours)
UPDATE flashcards 
SET difficulty = 2.6, interval_days = 3, next_review = date('now', '+3 days') 
WHERE id = 1;

-- ---------------------------------------------------------------------------
-- 4. QUIZ_SESSIONS & ANSWERS
-- ---------------------------------------------------------------------------
-- Démarrer un quiz
INSERT INTO quiz_sessions (user_id, total) VALUES (1, 10);
-- (Récupérer l'ID inséré avec sqlite3_last_insert_rowid())

-- Sauvegarder une réponse pendant le quiz
INSERT INTO quiz_answers (session_id, flashcard_id, user_answer, is_correct) 
VALUES (1, 5, '6.022 × 10^23', 1);

-- Clôturer le quiz avec le score final
UPDATE quiz_sessions 
SET score = 8.5, finished_at = CURRENT_TIMESTAMP 
WHERE id = 1;

-- Obtenir l'historique des quiz
SELECT score, total, started_at FROM quiz_sessions WHERE user_id = 1;

-- ---------------------------------------------------------------------------
-- 5. CHAT_MESSAGES
-- ---------------------------------------------------------------------------
-- Sauvegarder la question de l'utilisateur
INSERT INTO chat_messages (user_id, role, content) 
VALUES (1, 'user', 'Explique-moi ce théorème.');

-- Sauvegarder la réponse de Gemini
INSERT INTO chat_messages (user_id, role, content, model_used, tokens_used) 
VALUES (1, 'assistant', 'Le théorème stipule que...', 'gemini-2.0-flash', 150);

-- Récupérer l'historique d'une conversation pour le contexte IA
SELECT role, content FROM chat_messages 
WHERE user_id = 1 
ORDER BY created_at ASC LIMIT 20;

-- ---------------------------------------------------------------------------
-- 6. STUDY_SESSIONS
-- ---------------------------------------------------------------------------
-- Ajouter une session après avoir fermé l'app
INSERT INTO study_sessions (user_id, duration_seconds, xp_earned, streak_day) 
VALUES (1, 3600, 50, 3);

-- Voir le temps total d'étude de l'utilisateur
SELECT SUM(duration_seconds) AS total_time FROM study_sessions WHERE user_id = 1;

-- ---------------------------------------------------------------------------
-- 7. MIND_MAPS
-- ---------------------------------------------------------------------------
-- Enregistrer une carte mentale
INSERT INTO mind_maps (user_id, document_id, nodes_json) 
VALUES (1, 1, '{"root": "Chimie", "children": []}');

-- Récupérer la carte mentale d'un document
SELECT nodes_json FROM mind_maps WHERE document_id = 1;

-- Mettre à jour la carte mentale
UPDATE mind_maps SET nodes_json = '{"root": "Chimie", "children": ["Mole"]}' WHERE id = 1;
