/**
 * @file flashcard.c
 * @brief Implémentation de la gestion des flashcards.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sqlite3.h>
#include "review/flashcard.h"
#include "utils/logger.h"

SSError flashcard_create_deck(sqlite3 *db,
                              int64_t user_id,
                              const char *name,
                              int64_t document_id,
                              int64_t *deck_id) {
    if (!db || !name || !deck_id) return SS_ERR_NULL_PTR;

    const char *sql =
        "INSERT INTO decks (user_id, document_id, name) VALUES (?, ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, user_id);
    sqlite3_bind_int64(stmt, 2, document_id);
    sqlite3_bind_text(stmt, 3, name, -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) return SS_ERR_DB_QUERY;

    *deck_id = sqlite3_last_insert_rowid(db);
    return SS_OK;
}

SSError flashcard_add(sqlite3 *db,
                      int64_t deck_id,
                      const char *front,
                      const char *back,
                      int64_t *card_id) {
    if (!db || !front || !back || !card_id) return SS_ERR_NULL_PTR;

    const char *sql =
        "INSERT INTO flashcards (deck_id, front, back) VALUES (?, ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, deck_id);
    sqlite3_bind_text(stmt, 2, front, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, back, -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) return SS_ERR_DB_QUERY;

    *card_id = sqlite3_last_insert_rowid(db);
    return SS_OK;
}

SSError flashcard_get_due(sqlite3 *db,
                          int64_t deck_id,
                          Flashcard **cards,
                          int *count) {
    if (!db || !cards || !count) return SS_ERR_NULL_PTR;

    const char *sql =
        "SELECT id, deck_id, front, back, difficulty, interval_days, "
        "repetitions, next_review FROM flashcards "
        "WHERE deck_id = ? AND next_review <= date('now') "
        "ORDER BY next_review ASC;";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, deck_id);

    /* Première passe : compter les résultats */
    int n = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW) n++;
    sqlite3_reset(stmt);

    if (n == 0) {
        *cards = NULL;
        *count = 0;
        sqlite3_finalize(stmt);
        return SS_OK;
    }

    *cards = calloc(n, sizeof(Flashcard));
    if (!*cards) {
        sqlite3_finalize(stmt);
        return SS_ERR_ALLOC;
    }

    /* Deuxième passe : remplir le tableau */
    int i = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW && i < n) {
        (*cards)[i].id            = sqlite3_column_int64(stmt, 0);
        (*cards)[i].deck_id       = sqlite3_column_int64(stmt, 1);
        (*cards)[i].front         = strdup((const char *)sqlite3_column_text(stmt, 2));
        (*cards)[i].back          = strdup((const char *)sqlite3_column_text(stmt, 3));
        (*cards)[i].difficulty    = sqlite3_column_double(stmt, 4);
        (*cards)[i].interval_days = sqlite3_column_int(stmt, 5);
        (*cards)[i].repetitions   = sqlite3_column_int(stmt, 6);
        strncpy((*cards)[i].next_review,
                (const char *)sqlite3_column_text(stmt, 7), 15);
        i++;
    }

    *count = i;
    sqlite3_finalize(stmt);
    return SS_OK;
}

SSError flashcard_generate_from_text(sqlite3 *db,
                                     int64_t deck_id,
                                     const char *source_text,
                                     int max_cards,
                                     int *generated) {
    if (!db || !source_text || !generated) return SS_ERR_NULL_PTR;

    /* TODO: Appeler l'IA pour générer des paires question/réponse
     * à partir du texte source, puis les insérer via flashcard_add().
     *
     * Prompt IA suggéré :
     * "À partir du texte suivant, génère {max_cards} flashcards au format JSON :
     *  [{\"front\": \"question\", \"back\": \"réponse\"}, ...]
     *  Texte : {source_text}"
     */

    *generated = 0;
    LOG_WARN("flashcard_generate_from_text: implémentation IA requise.");
    return SS_OK;
}
