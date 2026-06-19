/**
 * @file quiz.c
 * @brief Implémentation des quiz adaptatifs.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sqlite3.h>
#include "review/quiz.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

SSError quiz_generate(sqlite3 *db,
                      int64_t user_id,
                      int64_t document_id,
                      int num_questions,
                      const char *difficulty,
                      int64_t *quiz_id) {
    if (!db || !difficulty || !quiz_id) return SS_ERR_NULL_PTR;

    /* Créer le quiz en base */
    const char *sql =
        "INSERT INTO quizzes (user_id, document_id, title, difficulty, total_questions) "
        "VALUES (?, ?, 'Quiz auto-généré', ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, user_id);
    sqlite3_bind_int64(stmt, 2, document_id);
    sqlite3_bind_text(stmt, 3, difficulty, -1, SQLITE_STATIC);
    sqlite3_bind_int(stmt, 4, num_questions);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) return SS_ERR_DB_QUERY;

    *quiz_id = sqlite3_last_insert_rowid(db);

    /* TODO: Appeler l'IA pour générer les questions et les insérer
     * dans quiz_questions avec le quiz_id créé. */

    LOG_INFO("Quiz créé : id=%lld, difficulté=%s, questions=%d",
             (long long)*quiz_id, difficulty, num_questions);
    return SS_OK;
}

SSError quiz_get_questions(sqlite3 *db,
                           int64_t quiz_id,
                           QuizQuestion **questions,
                           int *count) {
    if (!db || !questions || !count) return SS_ERR_NULL_PTR;

    const char *sql =
        "SELECT id, quiz_id, question_text, question_type, options_json, "
        "correct_answer, explanation, order_index "
        "FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index;";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, quiz_id);

    /* Compter les résultats */
    int n = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW) n++;
    sqlite3_reset(stmt);

    if (n == 0) {
        *questions = NULL;
        *count = 0;
        sqlite3_finalize(stmt);
        return SS_OK;
    }

    *questions = calloc(n, sizeof(QuizQuestion));
    if (!*questions) {
        sqlite3_finalize(stmt);
        return SS_ERR_ALLOC;
    }

    int i = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW && i < n) {
        (*questions)[i].id          = sqlite3_column_int64(stmt, 0);
        (*questions)[i].quiz_id     = sqlite3_column_int64(stmt, 1);
        (*questions)[i].question_text = strdup((const char *)sqlite3_column_text(stmt, 2));
        strncpy((*questions)[i].question_type,
                (const char *)sqlite3_column_text(stmt, 3), 15);
        const char *opts = (const char *)sqlite3_column_text(stmt, 4);
        (*questions)[i].options_json  = opts ? strdup(opts) : NULL;
        (*questions)[i].correct_answer = strdup((const char *)sqlite3_column_text(stmt, 5));
        const char *expl = (const char *)sqlite3_column_text(stmt, 6);
        (*questions)[i].explanation   = expl ? strdup(expl) : NULL;
        (*questions)[i].order_index   = sqlite3_column_int(stmt, 7);
        i++;
    }

    *count = i;
    sqlite3_finalize(stmt);
    return SS_OK;
}

SSError quiz_submit_attempt(sqlite3 *db,
                            int64_t quiz_id,
                            int64_t user_id,
                            const char *answers_json,
                            double *score) {
    if (!db || !answers_json || !score) return SS_ERR_NULL_PTR;

    /* TODO: Comparer les réponses avec les réponses correctes
     * et calculer le score. Pour l'instant, on sauvegarde juste la tentative. */

    *score = 0.0;

    const char *sql =
        "INSERT INTO quiz_attempts (quiz_id, user_id, score, answers_json) "
        "VALUES (?, ?, ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, quiz_id);
    sqlite3_bind_int64(stmt, 2, user_id);
    sqlite3_bind_double(stmt, 3, *score);
    sqlite3_bind_text(stmt, 4, answers_json, -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    return (rc == SQLITE_DONE) ? SS_OK : SS_ERR_DB_QUERY;
}
