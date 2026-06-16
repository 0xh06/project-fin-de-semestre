/**
 * @file models.h
 * @brief Structures de données (modèles) mappées sur les tables SQLite.
 *
 * Chaque struct correspond à une ligne de la table correspondante.
 */

#ifndef SMARTSTUDY_DB_MODELS_H
#define SMARTSTUDY_DB_MODELS_H

#include <stdint.h>

/** Utilisateur */
typedef struct {
    int64_t id;
    char    username[128];
    char    email[256];
    char    created_at[32];
} User;

/** Document PDF importé */
typedef struct {
    int64_t id;
    int64_t user_id;
    char    title[256];
    char    file_path[512];
    char   *content_text;      /* Alloué dynamiquement (peut être volumineux) */
    int     page_count;
    int64_t file_size_bytes;
    char    imported_at[32];
} Document;

/** Session de chat */
typedef struct {
    int64_t id;
    int64_t user_id;
    int64_t document_id;       /* 0 si chat libre */
    char    title[256];
    char    ai_provider[32];
    char    created_at[32];
} ChatSession;

/** Message de chat */
typedef struct {
    int64_t id;
    int64_t session_id;
    char    role[16];          /* "user" | "assistant" | "system" */
    char   *content;           /* Alloué dynamiquement */
    int     tokens;
    char    created_at[32];
} ChatMessage;

/** Deck de flashcards */
typedef struct {
    int64_t id;
    int64_t user_id;
    int64_t document_id;
    char    name[256];
    char   *description;
} Deck;

/** Flashcard avec métadonnées SM-2 */
typedef struct {
    int64_t id;
    int64_t deck_id;
    char   *front;
    char   *back;
    double  difficulty;        /* Facteur de facilité SM-2 (défaut: 2.5) */
    int     interval_days;
    int     repetitions;
    char    next_review[16];   /* Format: YYYY-MM-DD */
} Flashcard;

/** Quiz */
typedef struct {
    int64_t id;
    int64_t user_id;
    int64_t document_id;
    char    title[256];
    char    difficulty[16];    /* "easy" | "medium" | "hard" */
    int     total_questions;
} Quiz;

/** Question de quiz */
typedef struct {
    int64_t id;
    int64_t quiz_id;
    char   *question_text;
    char    question_type[16]; /* "mcq" | "true_false" | "open" */
    char   *options_json;      /* JSON array pour QCM */
    char   *correct_answer;
    char   *explanation;
    int     order_index;
} QuizQuestion;

/** Statistiques de progression */
typedef struct {
    int64_t user_id;
    int     total_study_time_sec;
    int     documents_read;
    int     flashcards_reviewed;
    int     quizzes_completed;
    double  average_quiz_score;
    int     current_streak_days;
    int     longest_streak_days;
    char    last_study_date[16];
} ProgressStats;

/** Nœud de mind-map */
typedef struct {
    int64_t id;
    int64_t user_id;
    int64_t document_id;
    char    title[256];
    char   *data_json;         /* Structure arborescente en JSON */
    char    created_at[32];
    char    updated_at[32];
} MindMap;

#endif /* SMARTSTUDY_DB_MODELS_H */
