/**
 * @file gamification.h
 * @brief Système de gamification inspiré de Duolingo.
 */

#ifndef SMARTSTUDY_GAMIFICATION_GAMIFICATION_H
#define SMARTSTUDY_GAMIFICATION_GAMIFICATION_H

#include "core/error.h"
#include <stdint.h>
#include <time.h>

/** Types d'actions XP */
typedef enum {
    XP_ACTION_FLASHCARD_REVIEW = 5,
    XP_ACTION_QUIZ_COMPLETED_BASE = 10,
    XP_ACTION_DOCUMENT_ANALYZED = 20,
    XP_ACTION_STREAK_MAINTAINED = 10,
    XP_ACTION_PERFECT_QUIZ = 50,
    XP_ACTION_FIRST_DOCUMENT = 30
} XPAction;

/** Résultat de vérification de streak */
typedef struct {
    int     current_streak;      /**< Streak actuel en jours */
    int     longest_streak;      /**< Plus longue streak */
    bool    streak_maintained;   /**< Streak maintenue aujourd'hui */
    bool    streak_broken;       /**< Streak brisée */
    time_t  last_study_date;     /**< Date de la dernière étude */
} StreakResult;

/** Badge */
typedef struct {
    int64_t id;
    char    name[64];
    char    description[256];
    char    icon[32];            /**< Emoji ou nom d'icône */
    time_t  awarded_at;
} Badge;

/** Statistiques du dashboard */
typedef struct {
    int64_t user_id;
    int     xp_total;
    int     level;
    int     xp_to_next_level;
    int     streak_days;
    int     longest_streak;
    int     documents_count;
    int     flashcards_mastered;
    int     flashcards_total;
    int     quizzes_completed;
    int     perfect_quizzes;
    int     study_time_minutes;
    int     weekly_xp[7];        /**< XP des 7 derniers jours (index 0 = aujourd'hui) */
    int     badges_count;
} DashboardStats;

/**
 * Ajoute de l'XP à un utilisateur.
 * @param user_id  ID de l'utilisateur
 * @param xp       Quantité d'XP à ajouter
 * @param reason   Raison de l'ajout (pour logging)
 * @return SS_OK ou code d'erreur
 */
SSError xp_add(int64_t user_id, int xp, const char *reason);

/**
 * Calcule le niveau à partir de l'XP total.
 * @param total_xp  XP total
 * @return Niveau calculé
 */
int level_calculate(int total_xp);

/**
 * Calcule l'XP nécessaire pour le niveau suivant.
 * @param current_level  Niveau actuel
 * @return XP nécessaire
 */
int xp_to_next_level(int current_level);

/**
 * Vérifie et met à jour la streak d'un utilisateur.
 * @param user_id  ID de l'utilisateur
 * @param out      Résultat de la vérification
 * @return SS_OK ou code d'erreur
 */
SSError streak_check_and_update(int64_t user_id, StreakResult *out);

/**
 * Enregistre une activité d'étude pour la streak.
 * @param user_id  ID de l'utilisateur
 * @return SS_OK ou code d'erreur
 */
SSError streak_record_activity(int64_t user_id);

/**
 * Vérifie et attribue les badges mérités.
 * @param user_id       ID de l'utilisateur
 * @param badges_out    Tableau de badges nouvellement attribués (alloué)
 * @param count_out     Nombre de nouveaux badges
 * @return SS_OK ou code d'erreur
 */
SSError badge_check_and_award(int64_t user_id, Badge **badges_out, int *count_out);

/**
 * Récupère tous les badges d'un utilisateur.
 * @param user_id   ID de l'utilisateur
 * @param badges    Tableau de badges (alloué, à libérer)
 * @param count     Nombre de badges
 * @return SS_OK ou code d'erreur
 */
SSError badge_get_user_badges(int64_t user_id, Badge **badges, int *count);

/**
 * Récupère les statistiques complètes du dashboard.
 * @param user_id  ID de l'utilisateur
 * @param out      Statistiques du dashboard
 * @return SS_OK ou code d'erreur
 */
SSError stats_get_dashboard(int64_t user_id, DashboardStats *out);

/**
 * Met à jour le temps d'étude.
 * @param user_id  ID de l'utilisateur
 * @param minutes  Minutes d'étude à ajouter
 * @return SS_OK ou code d'erreur
 */
SSError stats_add_study_time(int64_t user_id, int minutes);

/**
 * Libère un tableau de badges.
 * @param badges  Tableau de badges
 * @param count   Nombre de badges
 */
void badges_free(Badge *badges, int count);

/**
 * Initialise les tables de gamification dans la base de données.
 * @return SS_OK ou code d'erreur
 */
SSError gamification_init_db(void);

#endif /* SMARTSTUDY_GAMIFICATION_GAMIFICATION_H */
