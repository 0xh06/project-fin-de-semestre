/**
 * @file flashcard_srs.h
 * @brief Algorithme SM-2 de répétition espacée pour flashcards.
 */

#ifndef SMARTSTUDY_FLASHCARD_FLASHCARD_SRS_H
#define SMARTSTUDY_FLASHCARD_FLASHCARD_SRS_H

#include "core/error.h"
#include <stdint.h>
#include <time.h>

/** Résultat du calcul SM-2 */
typedef struct {
    int     new_interval;      /**< Nouvel intervalle en jours */
    float   new_easiness;      /**< Nouvelle facilité (E-Factor) */
    int     new_repetitions;   /**< Nouveau nombre de répétitions */
    time_t  next_review_ts;    /**< Timestamp de la prochaine révision */
    char    next_review_date[16]; /**< Date format YYYY-MM-DD */
} SRSResult;

/** Statistiques de flashcards pour un utilisateur */
typedef struct {
    int total_cards;          /**< Total des flashcards */
    int mastered_cards;       /**< Cartes maîtrisées (interval > 21 jours) */
    int learning_cards;       /**< Cartes en apprentissage (interval <= 21 jours) */
    int due_today;            /**< Cartes à réviser aujourd'hui */
    int due_this_week;        /**< Cartes à réviser cette semaine */
    double average_easiness;  /**< Facilité moyenne */
    int total_reviews;        /**< Nombre total de révisions effectuées */
} FlashcardStats;

/**
 * Calcule les paramètres SM-2 suivants une révision.
 * @param quality      Qualité de la réponse [0-5]:
 *                     0: échec total, 5: réponse parfaite
 * @param repetitions  Nombre de répétitions réussies consécutives
 * @param easiness     Facteur de facilité actuel (défaut: 2.5)
 * @param interval     Interval actuel en jours
 * @param out          Structure de résultat
 * @return SS_OK ou code d'erreur
 */
SSError srs_calculate_next_review(int quality, int repetitions, float easiness, 
                                   int interval, SRSResult *out);

/**
 * Enregistre une révision de flashcard et met à jour SQLite.
 * @param flashcard_id  ID de la flashcard
 * @param quality       Qualité de la réponse [0-5]
 * @param next_review_out  Date de prochaine révision (YYYY-MM-DD, allouée)
 * @return SS_OK ou code d'erreur
 */
SSError flashcard_review(int64_t flashcard_id, int quality, char **next_review_out);

/**
 * Récupère les flashcards à réviser aujourd'hui.
 * @param user_id   ID de l'utilisateur
 * @param out       Tableau de flashcards (alloué, à libérer avec flashcard_list_free)
 * @param count     Nombre de flashcards
 * @return SS_OK ou code d'erreur
 */
SSError flashcard_get_due_today(int64_t user_id, DBFlashcard **out, int *count);

/**
 * Récupère les statistiques de flashcards d'un utilisateur.
 * @param user_id   ID de l'utilisateur
 * @param out       Structure de statistiques
 * @return SS_OK ou code d'erreur
 */
SSError flashcard_get_stats(int64_t user_id, FlashcardStats *out);

/**
 * Génère des flashcards automatiquement depuis un texte via IA.
 * @param text          Texte source
 * @param user_id       ID de l'utilisateur
 * @param document_id   ID du document (0 si indépendant)
 * @param count_out     Nombre de flashcards générées
 * @return SS_OK ou code d'erreur
 */
SSError flashcard_generate_from_text(const char *text, int64_t user_id, 
                                     int64_t document_id, int *count_out);

/**
 * Évalue automatiquement la difficulté d'une flashcard via IA.
 * @param question   Question de la flashcard
 * @param answer     Réponse de la flashcard
 * @param difficulty_out  Difficulté estimée [1-5] (allouée)
 * @return SS_OK ou code d'erreur
 */
SSError flashcard_auto_difficulty(const char *question, const char *answer, 
                                  int *difficulty_out);

#endif /* SMARTSTUDY_FLASHCARD_FLASHCARD_SRS_H */
