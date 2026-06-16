/**
 * @file tracker.c
 * @brief Implémentation du suivi de progression.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sqlite3.h>
#include "progress/tracker.h"
#include "utils/logger.h"

SSError tracker_start_session(sqlite3 *db,
                              int64_t user_id,
                              int64_t document_id,
                              const char *activity,
                              int64_t *session_id) {
    if (!db || !activity || !session_id) return SS_ERR_NULL_PTR;

    const char *sql =
        "INSERT INTO study_sessions (user_id, document_id, activity) VALUES (?, ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, user_id);
    sqlite3_bind_int64(stmt, 2, document_id);
    sqlite3_bind_text(stmt, 3, activity, -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) return SS_ERR_DB_QUERY;

    *session_id = sqlite3_last_insert_rowid(db);
    LOG_INFO("Session d'étude démarrée : id=%lld, activité=%s",
             (long long)*session_id, activity);
    return SS_OK;
}

SSError tracker_end_session(sqlite3 *db, int64_t session_id) {
    if (!db) return SS_ERR_NULL_PTR;

    const char *sql =
        "UPDATE study_sessions "
        "SET ended_at = datetime('now'), "
        "    duration_sec = CAST((julianday('now') - julianday(started_at)) * 86400 AS INTEGER) "
        "WHERE id = ?;";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, session_id);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    return (rc == SQLITE_DONE) ? SS_OK : SS_ERR_DB_QUERY;
}

SSError tracker_get_stats(sqlite3 *db, int64_t user_id, ProgressStats *stats) {
    if (!db || !stats) return SS_ERR_NULL_PTR;

    memset(stats, 0, sizeof(ProgressStats));
    stats->user_id = user_id;

    const char *sql = "SELECT * FROM progress_stats WHERE user_id = ?;";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, user_id);

    if (sqlite3_step(stmt) == SQLITE_ROW) {
        stats->total_study_time_sec = sqlite3_column_int(stmt, 2);
        stats->documents_read       = sqlite3_column_int(stmt, 3);
        stats->flashcards_reviewed  = sqlite3_column_int(stmt, 4);
        stats->quizzes_completed    = sqlite3_column_int(stmt, 5);
        stats->average_quiz_score   = sqlite3_column_double(stmt, 6);
        stats->current_streak_days  = sqlite3_column_int(stmt, 7);
        stats->longest_streak_days  = sqlite3_column_int(stmt, 8);
        const char *last = (const char *)sqlite3_column_text(stmt, 9);
        if (last) strncpy(stats->last_study_date, last, 15);
    }

    sqlite3_finalize(stmt);
    return SS_OK;
}

SSError tracker_update_streak(sqlite3 *db, int64_t user_id) {
    if (!db) return SS_ERR_NULL_PTR;

    /* Upsert les stats : créer si inexistant, mettre à jour le streak */
    const char *sql =
        "INSERT INTO progress_stats (user_id, current_streak_days, last_study_date, updated_at) "
        "VALUES (?, 1, date('now'), datetime('now')) "
        "ON CONFLICT(user_id) DO UPDATE SET "
        "  current_streak_days = CASE "
        "    WHEN last_study_date = date('now', '-1 day') THEN current_streak_days + 1 "
        "    WHEN last_study_date = date('now') THEN current_streak_days "
        "    ELSE 1 "
        "  END, "
        "  longest_streak_days = MAX(longest_streak_days, "
        "    CASE "
        "      WHEN last_study_date = date('now', '-1 day') THEN current_streak_days + 1 "
        "      ELSE current_streak_days "
        "    END), "
        "  last_study_date = date('now'), "
        "  updated_at = datetime('now');";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, user_id);
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    return (rc == SQLITE_DONE) ? SS_OK : SS_ERR_DB_QUERY;
}
