/**
 * @file quiz.h
 * @brief Quiz adaptatifs générés par IA.
 *
 * Génération de quiz QCM/vrai-faux/ouverts, gestion des tentatives
 * et calcul du score.
 */

#ifndef SMARTSTUDY_REVIEW_QUIZ_H
#define SMARTSTUDY_REVIEW_QUIZ_H

#include <sqlite3.h>
#include "core/error.h"
#include "db/models.h"

/**
 * Génère un quiz à partir du contenu d'un document via l'IA.
 * @param db              Handle SQLite.
 * @param user_id         ID de l'utilisateur.
 * @param document_id     ID du document source.
 * @param num_questions   Nombre de questions souhaitées.
 * @param difficulty      "easy", "medium" ou "hard".
 * @param quiz_id         Pointeur de sortie pour l'ID du quiz créé.
 * @return SS_OK ou code d'erreur.
 */
SSError quiz_generate(sqlite3 *db,
                      int64_t user_id,
                      int64_t document_id,
                      int num_questions,
                      const char *difficulty,
                      int64_t *quiz_id);

/**
 * Récupère les questions d'un quiz.
 * @param db         Handle SQLite.
 * @param quiz_id    ID du quiz.
 * @param questions  Tableau de sortie (alloué, à free).
 * @param count      Nombre de questions retournées.
 * @return SS_OK ou code d'erreur.
 */
SSError quiz_get_questions(sqlite3 *db,
                           int64_t quiz_id,
                           QuizQuestion **questions,
                           int *count);

/**
 * Soumet les réponses et calcule le score.
 * @param db           Handle SQLite.
 * @param quiz_id      ID du quiz.
 * @param user_id      ID de l'utilisateur.
 * @param answers_json JSON des réponses données.
 * @param score        Pointeur de sortie pour le score (0.0 à 100.0).
 * @return SS_OK ou code d'erreur.
 */
SSError quiz_submit_attempt(sqlite3 *db,
                            int64_t quiz_id,
                            int64_t user_id,
                            const char *answers_json,
                            double *score);

#endif /* SMARTSTUDY_REVIEW_QUIZ_H */
