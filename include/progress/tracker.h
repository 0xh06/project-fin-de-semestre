/**
 * @file tracker.h
 * @brief Suivi de progression et statistiques d'étude.
 *
 * Enregistre les sessions d'étude, calcule les streaks et agrège
 * les statistiques utilisateur.
 */

#ifndef SMARTSTUDY_PROGRESS_TRACKER_H
#define SMARTSTUDY_PROGRESS_TRACKER_H

#include <sqlite3.h>
#include "core/error.h"
#include "db/models.h"

/**
 * Démarre une nouvelle session d'étude.
 * @param db          Handle SQLite.
 * @param user_id     ID de l'utilisateur.
 * @param document_id ID du document (0 si non lié).
 * @param activity    Type d'activité ("reading", "flashcard", "quiz", "chat", "mindmap").
 * @param session_id  Pointeur de sortie pour l'ID de session.
 * @return SS_OK ou code d'erreur.
 */
SSError tracker_start_session(sqlite3 *db,
                              int64_t user_id,
                              int64_t document_id,
                              const char *activity,
                              int64_t *session_id);

/**
 * Termine une session d'étude et enregistre la durée.
 * @param db          Handle SQLite.
 * @param session_id  ID de la session à terminer.
 * @return SS_OK ou code d'erreur.
 */
SSError tracker_end_session(sqlite3 *db, int64_t session_id);

/**
 * Récupère les statistiques globales d'un utilisateur.
 * @param db      Handle SQLite.
 * @param user_id ID de l'utilisateur.
 * @param stats   Pointeur de sortie.
 * @return SS_OK ou code d'erreur.
 */
SSError tracker_get_stats(sqlite3 *db, int64_t user_id, ProgressStats *stats);

/**
 * Met à jour le streak d'étude en fonction de la dernière activité.
 * @param db      Handle SQLite.
 * @param user_id ID de l'utilisateur.
 * @return SS_OK ou code d'erreur.
 */
SSError tracker_update_streak(sqlite3 *db, int64_t user_id);

#endif /* SMARTSTUDY_PROGRESS_TRACKER_H */
