/**
 * @file db.c
 * @brief Implémentation de la couche d'abstraction SQLite (DAL).
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "db/db.h"
#include "db/db_interface.h"

/* Handle global (Singleton pour l'app) */
static sqlite3 *g_db = NULL;
static char g_last_error[512] = {0};

/* Helpers internes */
static void set_error(const char *msg) {
    if (g_db) {
        snprintf(g_last_error, sizeof(g_last_error), "%s: %s", msg, sqlite3_errmsg(g_db));
    } else {
        snprintf(g_last_error, sizeof(g_last_error), "%s", msg);
    }
}

const char* db_error_msg(void) {
    return g_last_error;
}

static char* strdup_safe(const unsigned char *str) {
    if (!str) return NULL;
    return strdup((const char*)str);
}

/* =========================================================================
 * Connexion et Transactions
 * ========================================================================= */

DBError db_init(const char *path) {
    if (g_db) return DB_OK; /* Déjà init */
    if (!path) return DB_ERR_INVALID_PARAM;

    int rc = sqlite3_open(path, &g_db);
    if (rc != SQLITE_OK) {
        set_error("Impossible d'ouvrir la base de données");
        return DB_ERR_SQLITE;
    }

    /* Activer les contraintes de clés étrangères (désactivé par défaut) */
    sqlite3_exec(g_db, "PRAGMA foreign_keys = ON;", NULL, NULL, NULL);

    /* Dans un vrai scénario, on lirait schema.sql pour l'exécuter ici.
     * On suppose que la BDD est déjà créée via le CLI ou un script init. */
    return DB_OK;
}

void db_close(void) {
    if (g_db) {
        sqlite3_close(g_db);
        g_db = NULL;
    }
}

DBError db_begin(void) {
    if (sqlite3_exec(g_db, "BEGIN TRANSACTION;", NULL, NULL, NULL) != SQLITE_OK) {
        set_error("Échec BEGIN TRANSACTION");
        return DB_ERR_SQLITE;
    }
    return DB_OK;
}

DBError db_commit(void) {
    if (sqlite3_exec(g_db, "COMMIT;", NULL, NULL, NULL) != SQLITE_OK) {
        set_error("Échec COMMIT");
        return DB_ERR_SQLITE;
    }
    return DB_OK;
}

DBError db_rollback(void) {
    if (sqlite3_exec(g_db, "ROLLBACK;", NULL, NULL, NULL) != SQLITE_OK) {
        set_error("Échec ROLLBACK");
        return DB_ERR_SQLITE;
    }
    return DB_OK;
}

/* =========================================================================
 * CRUD - Utilisateurs (users)
 * ========================================================================= */

DBError user_create(const char *email, const char *password_hash, const char *settings_json, int64_t *out_id) {
    if (!g_db || !email || !password_hash) return DB_ERR_INVALID_PARAM;

    const char *sql = "INSERT INTO users (email, password_hash, settings_json) VALUES (?, ?, ?);";
    sqlite3_stmt *stmt;

    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        set_error("Preparation user_create");
        return DB_ERR_SQLITE;
    }

    sqlite3_bind_text(stmt, 1, email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, password_hash, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, settings_json ? settings_json : "{}", -1, SQLITE_TRANSIENT);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        set_error("Exécution user_create");
        return DB_ERR_SQLITE;
    }

    if (out_id) *out_id = sqlite3_last_insert_rowid(g_db);
    return DB_OK;
}

DBError user_find_by_email(const char *email, DBUser *out_user) {
    if (!g_db || !email || !out_user) return DB_ERR_INVALID_PARAM;
    memset(out_user, 0, sizeof(DBUser));

    const char *sql = "SELECT id, email, password_hash, created_at, settings_json FROM users WHERE email = ?;";
    sqlite3_stmt *stmt;

    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        set_error("Preparation user_find_by_email");
        return DB_ERR_SQLITE;
    }

    sqlite3_bind_text(stmt, 1, email, -1, SQLITE_STATIC);

    int rc = sqlite3_step(stmt);
    if (rc == SQLITE_ROW) {
        out_user->id            = sqlite3_column_int64(stmt, 0);
        out_user->email         = strdup_safe(sqlite3_column_text(stmt, 1));
        out_user->password_hash = strdup_safe(sqlite3_column_text(stmt, 2));
        out_user->created_at    = strdup_safe(sqlite3_column_text(stmt, 3));
        out_user->settings_json = strdup_safe(sqlite3_column_text(stmt, 4));
        rc = DB_OK;
    } else if (rc == SQLITE_DONE) {
        rc = DB_ERR_NOT_FOUND;
    } else {
        set_error("Lecture user_find_by_email");
        rc = DB_ERR_SQLITE;
    }

    sqlite3_finalize(stmt);
    return rc;
}

void user_free(DBUser *user) {
    if (!user) return;
    free(user->email);
    free(user->password_hash);
    free(user->created_at);
    free(user->settings_json);
    memset(user, 0, sizeof(DBUser));
}

/* =========================================================================
 * CRUD - Documents
 * ========================================================================= */

DBError document_save(const DBDocument *doc, int64_t *out_id) {
    if (!g_db || !doc || !doc->filename) return DB_ERR_INVALID_PARAM;

    const char *sql = "INSERT INTO documents (user_id, filename, content_text, summary_ai, tags) VALUES (?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt;

    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        set_error("Preparation document_save");
        return DB_ERR_SQLITE;
    }

    sqlite3_bind_int64(stmt, 1, doc->user_id);
    sqlite3_bind_text(stmt, 2, doc->filename, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, doc->content_text, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, doc->summary_ai, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 5, doc->tags, -1, SQLITE_TRANSIENT);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        set_error("Exécution document_save");
        return DB_ERR_SQLITE;
    }

    if (out_id) *out_id = sqlite3_last_insert_rowid(g_db);
    return DB_OK;
}

/* =========================================================================
 * CRUD - Flashcards
 * ========================================================================= */

DBError flashcard_save(const DBFlashcard *card, int64_t *out_id) {
    if (!g_db || !card || !card->front || !card->back) return DB_ERR_INVALID_PARAM;

    const char *sql = "INSERT INTO flashcards (document_id, user_id, front, back, difficulty, interval_days) VALUES (?, ?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt;

    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        set_error("Preparation flashcard_save");
        return DB_ERR_SQLITE;
    }

    /* Gère le cas où la flashcard n'est pas liée à un document (document_id = 0) */
    if (card->document_id > 0) {
        sqlite3_bind_int64(stmt, 1, card->document_id);
    } else {
        sqlite3_bind_null(stmt, 1);
    }
    
    sqlite3_bind_int64(stmt, 2, card->user_id);
    sqlite3_bind_text(stmt, 3, card->front, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 4, card->back, -1, SQLITE_TRANSIENT);
    sqlite3_bind_double(stmt, 5, card->difficulty == 0.0 ? 2.5 : card->difficulty);
    sqlite3_bind_int(stmt, 6, card->interval_days == 0 ? 1 : card->interval_days);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        set_error("Exécution flashcard_save");
        return DB_ERR_SQLITE;
    }

    if (out_id) *out_id = sqlite3_last_insert_rowid(g_db);
    return DB_OK;
}

DBError flashcard_list_due_today(int64_t user_id, DBFlashcard **out_cards, int *out_count) {
    if (!g_db || !out_cards || !out_count) return DB_ERR_INVALID_PARAM;
    
    *out_cards = NULL;
    *out_count = 0;

    const char *sql = "SELECT id, document_id, front, back, difficulty, next_review, interval_days "
                      "FROM flashcards "
                      "WHERE user_id = ? AND next_review <= datetime('now', 'localtime');";
                      
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        set_error("Preparation flashcard_list_due");
        return DB_ERR_SQLITE;
    }

    sqlite3_bind_int64(stmt, 1, user_id);

    /* On va allouer dynamiquement un tableau. (Dans un vrai projet, on gèrerait une liste chaînée ou un allocateur récursif, ici on fait simple) */
    int capacity = 10;
    DBFlashcard *cards = malloc(capacity * sizeof(DBFlashcard));
    if (!cards) {
        sqlite3_finalize(stmt);
        return DB_ERR_ALLOC;
    }
    
    int count = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW) {
        if (count >= capacity) {
            capacity *= 2;
            DBFlashcard *new_cards = realloc(cards, capacity * sizeof(DBFlashcard));
            if (!new_cards) {
                /* Échec d'allocation : on nettoie et on sort */
                for(int i=0; i<count; i++) {
                    free(cards[i].front);
                    free(cards[i].back);
                    free(cards[i].next_review);
                }
                free(cards);
                sqlite3_finalize(stmt);
                return DB_ERR_ALLOC;
            }
            cards = new_cards;
        }

        cards[count].id            = sqlite3_column_int64(stmt, 0);
        cards[count].document_id   = sqlite3_column_int64(stmt, 1);
        cards[count].user_id       = user_id;
        cards[count].front         = strdup_safe(sqlite3_column_text(stmt, 2));
        cards[count].back          = strdup_safe(sqlite3_column_text(stmt, 3));
        cards[count].difficulty    = sqlite3_column_double(stmt, 4);
        cards[count].next_review   = strdup_safe(sqlite3_column_text(stmt, 5));
        cards[count].interval_days = sqlite3_column_int(stmt, 6);
        count++;
    }

    sqlite3_finalize(stmt);
    
    *out_cards = cards;
    *out_count = count;
    return DB_OK;
}

void flashcard_list_free(DBFlashcard *cards, int count) {
    if (!cards) return;
    for (int i = 0; i < count; i++) {
        free(cards[i].front);
        free(cards[i].back);
        free(cards[i].next_review);
    }
    free(cards);
}

/* =========================================================================
 * CRUD - Chat Messages
 * ========================================================================= */

DBError chat_message_save(const DBChatMessage *msg, int64_t *out_id) {
    if (!g_db || !msg || !msg->role || !msg->content) return DB_ERR_INVALID_PARAM;

    const char *sql = "INSERT INTO chat_messages (user_id, role, content, model_used, tokens_used) VALUES (?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt;

    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        set_error("Preparation chat_message_save");
        return DB_ERR_SQLITE;
    }

    sqlite3_bind_int64(stmt, 1, msg->user_id);
    sqlite3_bind_text(stmt, 2, msg->role, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, msg->content, -1, SQLITE_TRANSIENT);
    
    if (msg->model_used) {
        sqlite3_bind_text(stmt, 4, msg->model_used, -1, SQLITE_TRANSIENT);
    } else {
        sqlite3_bind_null(stmt, 4);
    }
    
    sqlite3_bind_int(stmt, 5, msg->tokens_used);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        set_error("Exécution chat_message_save");
        return DB_ERR_SQLITE;
    }

    if (out_id) *out_id = sqlite3_last_insert_rowid(g_db);
    return DB_OK;
}

DBError sqlite_document_get_all_by_user(int64_t user_id, DBDocument **out_docs, int *out_count) {
    /* STUB */
    if (out_docs) *out_docs = NULL;
    if (out_count) *out_count = 0;
    return DB_OK;
}

void sqlite_document_list_free(DBDocument *docs, int count) {
    /* STUB */
    (void)docs;
    (void)count;
}

DBError sqlite_flashcard_update_review(int64_t card_id, double difficulty, int interval_days, const char *next_review) {
    /* STUB */
    return DB_OK;
}

/* Instanciation de l'interface SQLite */
DBInterface sqlite_interface = {
    .init = db_init,
    .close = db_close,
    .begin = db_begin,
    .commit = db_commit,
    .rollback = db_rollback,
    .user_create = user_create,
    .user_find_by_email = user_find_by_email,
    .document_save = document_save,
    .document_get_all_by_user = sqlite_document_get_all_by_user,
    .flashcard_save = flashcard_save,
    .flashcard_update_review = sqlite_flashcard_update_review,
    .flashcard_list_due_today = flashcard_list_due_today,
    .chat_message_save = chat_message_save,
    .user_free = user_free,
    .document_list_free = sqlite_document_list_free,
    .flashcard_list_free = flashcard_list_free
};
