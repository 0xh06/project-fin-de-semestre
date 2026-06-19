/**
 * @file db.h
 * @brief Couche d'abstraction SQLite (DAL) pour SmartStudy AI.
 * 
 * Centralise tous les accès à la base de données.
 * Utilise les requêtes préparées pour la sécurité et gère les transactions.
 */

#ifndef SMARTSTUDY_DB_DB_H
#define SMARTSTUDY_DB_DB_H

#include <sqlite3.h>
#include <stdint.h>
#include <stdbool.h>

/** 
 * Codes d'erreur de la couche de base de données 
 */
typedef enum {
    DB_OK = 0,
    DB_ERR_ALLOC,
    DB_ERR_SQLITE,
    DB_ERR_NOT_FOUND,
    DB_ERR_INVALID_PARAM
} DBError;

/**
 * Retourne le dernier message d'erreur SQLite.
 */
const char* db_error_msg(void);

/* =========================================================================
 * Connexion et Transactions
 * ========================================================================= */

/**
 * Initialise la connexion SQLite, exécute les migrations (schema.sql) si besoin.
 * @param path Chemin vers le fichier .db
 * @return DB_OK en cas de succès
 */
DBError db_init(const char *path);

/**
 * Ferme la connexion SQLite proprement.
 */
void db_close(void);

DBError db_begin(void);
DBError db_commit(void);
DBError db_rollback(void);

/* =========================================================================
 * Modèles de données
 * ========================================================================= */

typedef struct {
    int64_t id;
    char *email;
    char *password_hash;
    char *created_at;
    char *settings_json;
} DBUser;

typedef struct {
    int64_t id;
    int64_t user_id;
    char *filename;
    char *content_text;
    char *summary_ai;
    char *tags;
    char *uploaded_at;
} DBDocument;

typedef struct {
    int64_t id;
    int64_t document_id;
    int64_t user_id;
    char *front;
    char *back;
    double difficulty;
    char *next_review;
    int interval_days;
} DBFlashcard;

typedef struct {
    int64_t id;
    int64_t user_id;
    char *role;
    char *content;
    char *model_used;
    int tokens_used;
    char *created_at;
} DBChatMessage;

/* =========================================================================
 * CRUD - Utilisateurs (users)
 * ========================================================================= */

DBError user_create(const char *email, const char *password_hash, const char *settings_json, int64_t *out_id);
DBError user_find_by_email(const char *email, DBUser *out_user);
void    user_free(DBUser *user);

/* =========================================================================
 * CRUD - Documents
 * ========================================================================= */

DBError document_save(const DBDocument *doc, int64_t *out_id);
DBError document_get_all_by_user(int64_t user_id, DBDocument **out_docs, int *out_count);
void    document_list_free(DBDocument *docs, int count);

/* =========================================================================
 * CRUD - Flashcards
 * ========================================================================= */

DBError flashcard_save(const DBFlashcard *card, int64_t *out_id);
DBError flashcard_update_review(int64_t card_id, double difficulty, int interval_days, const char *next_review);
DBError flashcard_list_due_today(int64_t user_id, DBFlashcard **out_cards, int *out_count);
void    flashcard_list_free(DBFlashcard *cards, int count);

/* =========================================================================
 * CRUD - Chat Messages
 * ========================================================================= */

DBError chat_message_save(const DBChatMessage *msg, int64_t *out_id);

#endif /* SMARTSTUDY_DB_DB_H */
