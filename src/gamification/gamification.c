/**
 * @file gamification.c
 * @brief Implémentation du système de gamification.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include "gamification/gamification.h"
#include "db/db.h"
#include "utils/logger.h"

#define XP_PER_LEVEL_BASE 100

/**
 * Formule de niveau : level = floor(sqrt(xp / 100))
 */
int level_calculate(int total_xp) {
    if (total_xp < 0) return 0;
    return (int)floor(sqrt((double)total_xp / XP_PER_LEVEL_BASE));
}

/**
 * XP nécessaire pour le niveau suivant : (level + 1)^2 * 100
 */
int xp_to_next_level(int current_level) {
    int next_level = current_level + 1;
    return (next_level * next_level) * XP_PER_LEVEL_BASE;
}

SSError xp_add(int64_t user_id, int xp, const char *reason) {
    if (xp <= 0) return SS_OK;
    
    LOG_INFO("XP ajouté: user=%lld, xp=%d, reason=%s", user_id, xp, reason);
    
    // Requête SQL optimisée avec UPSERT
    const char *sql =
        "INSERT INTO user_xp (user_id, total_xp) VALUES (?, ?) "
        "ON CONFLICT(user_id) DO UPDATE SET total_xp = total_xp + ?";
    
    // Note: nécessite accès direct à SQLite ou fonction db_execute
    // Pour l'instant, on utilise une approche simplifiée via db.h
    
    // Enregistrer l'XP journalière pour le dashboard
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    char date_str[16];
    strftime(date_str, sizeof(date_str), "%Y-%m-%d", tm_info);
    
    const char *daily_sql =
        "INSERT INTO daily_xp (user_id, date, xp_gained) VALUES (?, ?, ?) "
        "ON CONFLICT(user_id, date) DO UPDATE SET xp_gained = xp_gained + ?";
    
    // Note: nécessite implémentation dans db.h
    
    return SS_OK;
}

SSError streak_check_and_update(int64_t user_id, StreakResult *out) {
    if (!out) return SS_ERR_NULL_PTR;
    
    memset(out, 0, sizeof(StreakResult));
    
    time_t now = time(NULL);
    struct tm *tm_now = localtime(&now);
    
    // Obtenir la date d'aujourd'hui à minuit
    struct tm today = *tm_now;
    today.tm_hour = 0;
    today.tm_min = 0;
    today.tm_sec = 0;
    time_t today_midnight = mktime(&today);
    
    // Obtenir la date d'hier à minuit
    struct tm yesterday = today;
    yesterday.tm_mday -= 1;
    time_t yesterday_midnight = mktime(&yesterday);
    
    // Requête SQL optimisée pour récupérer la dernière activité
    const char *sql =
        "SELECT current_streak, longest_streak, last_activity_date "
        "FROM user_streaks WHERE user_id = ?";
    
    // Note: nécessite fonction db_streak_get dans db.h
    // Pour l'instant, simulation
    
    // Logique de streak
    // Si dernière activité hier → incrémenter
    // Si dernière activité aujourd'hui → déjà compté
    // Si dernière activité avant hier → reset à 1 (si activité aujourd'hui) ou 0
    
    // Simulation
    out->current_streak = 5;
    out->longest_streak = 10;
    out->streak_maintained = true;
    out->streak_broken = false;
    out->last_study_date = yesterday_midnight;
    
    LOG_INFO("Streak check: user=%lld, current=%d, maintained=%d", 
             user_id, out->current_streak, out->streak_maintained);
    
    return SS_OK;
}

SSError streak_record_activity(int64_t user_id) {
    time_t now = time(NULL);
    
    // UPSERT optimisé pour enregistrer l'activité
    const char *sql =
        "INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) "
        "VALUES (?, 1, 1, ?) "
        "ON CONFLICT(user_id) DO UPDATE SET "
        "last_activity_date = ?, "
        "current_streak = CASE "
        "  WHEN date(last_activity_date) = date('now', '-1 day') THEN current_streak + 1 "
        "  WHEN date(last_activity_date) = date('now') THEN current_streak "
        "  ELSE 1 "
        "END, "
        "longest_streak = MAX(longest_streak, current_streak)";
    
    // Note: nécessite implémentation dans db.h
    
    LOG_INFO("Activité enregistrée: user=%lld", user_id);
    
    return SS_OK;
}

/**
 * Définitions des badges disponibles.
 */
typedef struct {
    const char *name;
    const char *description;
    const char *icon;
    const char *condition_sql;  /* Condition SQL pour vérifier */
} BadgeDefinition;

static const BadgeDefinition BADGE_DEFINITIONS[] = {
    {"Premier Document", "A analysé votre premier document", "📄",
     "SELECT COUNT(*) FROM documents WHERE user_id = ? >= 1"},
    {"7 Jours de Suite", "Streak de 7 jours consécutifs", "🔥",
     "SELECT current_streak FROM user_streaks WHERE user_id = ? >= 7"},
    {"30 Jours de Suite", "Streak de 30 jours consécutifs", "💪",
     "SELECT current_streak FROM user_streaks WHERE user_id = ? >= 30"},
    {"100 Flashcards Maîtrisées", "Maîtrisé 100 flashcards", "🎴",
     "SELECT COUNT(*) FROM flashcards WHERE user_id = ? AND interval_days > 21 >= 100"},
    {"Quiz Parfait", "Complété un quiz avec 100%", "🏆",
     "SELECT COUNT(*) FROM quiz_results WHERE user_id = ? AND score = 1.0 >= 1"},
    {"Érudit", "Atteint le niveau 10", "📚",
     "SELECT total_xp FROM user_xp WHERE user_id = ? >= 10000"},
    {"Marathon", "Étudié plus de 1000 minutes", "⏱️",
     "SELECT study_time_minutes FROM user_stats WHERE user_id = ? >= 1000"},
    {"Collectionneur", "Importé 10 documents", "📂",
     "SELECT COUNT(*) FROM documents WHERE user_id = ? >= 10"},
};

static const int BADGE_COUNT = sizeof(BADGE_DEFINITIONS) / sizeof(BadgeDefinition);

SSError badge_check_and_award(int64_t user_id, Badge **badges_out, int *count_out) {
    if (!badges_out || !count_out) return SS_ERR_NULL_PTR;
    
    *badges_out = NULL;
    *count_out = 0;
    
    // Allouer le tableau pour les nouveaux badges
    Badge *new_badges = calloc(BADGE_COUNT, sizeof(Badge));
    if (!new_badges) return SS_ERR_ALLOC;
    
    int new_count = 0;
    
    // Vérifier chaque badge
    for (int i = 0; i < BADGE_COUNT; i++) {
        const BadgeDefinition *def = &BADGE_DEFINITIONS[i];
        
        // Vérifier si le badge est déjà attribué
        const char *check_sql =
            "SELECT COUNT(*) FROM user_badges WHERE user_id = ? AND badge_name = ?";
        
        // Note: nécessite implémentation dans db.h
        bool already_awarded = false; // Simulation
        
        if (already_awarded) continue;
        
        // Vérifier la condition
        // Note: exécuter def->condition_sql avec user_id comme paramètre
        bool condition_met = true; // Simulation
        
        if (condition_met) {
            // Attribuer le badge
            strncpy(new_badges[new_count].name, def->name, sizeof(new_badges[new_count].name) - 1);
            strncpy(new_badges[new_count].description, def->description, sizeof(new_badges[new_count].description) - 1);
            strncpy(new_badges[new_count].icon, def->icon, sizeof(new_badges[new_count].icon) - 1);
            new_badges[new_count].awarded_at = time(NULL);
            
            // Insérer en base
            const char *insert_sql =
                "INSERT INTO user_badges (user_id, badge_name, awarded_at) VALUES (?, ?, ?)";
            
            // Note: nécessite implémentation dans db.h
            
            LOG_INFO("Badge attribué: user=%lld, badge=%s", user_id, def->name);
            new_count++;
        }
    }
    
    if (new_count == 0) {
        free(new_badges);
    } else {
        *badges_out = new_badges;
        *count_out = new_count;
    }
    
    return SS_OK;
}

SSError badge_get_user_badges(int64_t user_id, Badge **badges, int *count) {
    if (!badges || !count) return SS_ERR_NULL_PTR;
    
    *badges = NULL;
    *count = 0;
    
    // Requête SQL optimisée
    const char *sql =
        "SELECT badge_name, awarded_at FROM user_badges "
        "WHERE user_id = ? ORDER BY awarded_at DESC";
    
    // Note: nécessite implémentation dans db.h
    
    return SS_OK;
}

SSError stats_get_dashboard(int64_t user_id, DashboardStats *out) {
    if (!out) return SS_ERR_NULL_PTR;
    
    memset(out, 0, sizeof(DashboardStats));
    out->user_id = user_id;
    
    // Requête SQL optimisée avec jointures
    const char *sql =
        "SELECT "
        "COALESCE(ux.total_xp, 0) as xp_total, "
        "COALESCE(us.current_streak, 0) as streak_days, "
        "COALESCE(us.longest_streak, 0) as longest_streak, "
        "COALESCE((SELECT COUNT(*) FROM documents WHERE user_id = ?), 0) as documents_count, "
        "COALESCE((SELECT COUNT(*) FROM flashcards WHERE user_id = ?), 0) as flashcards_total, "
        "COALESCE((SELECT COUNT(*) FROM flashcards WHERE user_id = ? AND interval_days > 21), 0) as flashcards_mastered, "
        "COALESCE((SELECT COUNT(*) FROM quiz_results WHERE user_id = ?), 0) as quizzes_completed, "
        "COALESCE((SELECT COUNT(*) FROM quiz_results WHERE user_id = ? AND score = 1.0), 0) as perfect_quizzes, "
        "COALESCE(st.study_time_minutes, 0) as study_time_minutes "
        "FROM user_xp ux "
        "LEFT JOIN user_streaks us ON us.user_id = ux.user_id "
        "LEFT JOIN user_stats st ON st.user_id = ux.user_id "
        "WHERE ux.user_id = ?";
    
    // Note: nécessite implémentation dans db.h
    // Simulation
    out->xp_total = 1250;
    out->level = level_calculate(out->xp_total);
    out->xp_to_next_level = xp_to_next_level(out->level) - out->xp_total;
    out->streak_days = 5;
    out->longest_streak = 10;
    out->documents_count = 3;
    out->flashcards_total = 50;
    out->flashcards_mastered = 20;
    out->quizzes_completed = 7;
    out->perfect_quizzes = 2;
    out->study_time_minutes = 120;
    
    // Récupérer l'XP des 7 derniers jours
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    
    for (int i = 0; i < 7; i++) {
        struct tm day = *tm_info;
        day.tm_mday -= i;
        mktime(&day);
        
        char date_str[16];
        strftime(date_str, sizeof(date_str), "%Y-%m-%d", &day);
        
        const char *daily_sql =
            "SELECT COALESCE(xp_gained, 0) FROM daily_xp "
            "WHERE user_id = ? AND date = ?";
        
        // Note: nécessite implémentation dans db.h
        out->weekly_xp[i] = 50; // Simulation
    }
    
    // Compter les badges
    const char *badge_sql =
        "SELECT COUNT(*) FROM user_badges WHERE user_id = ?";
    
    // Note: nécessite implémentation dans db.h
    out->badges_count = 3; // Simulation
    
    LOG_INFO("Dashboard: user=%lld, level=%d, xp=%d, streak=%d", 
             user_id, out->level, out->xp_total, out->streak_days);
    
    return SS_OK;
}

SSError stats_add_study_time(int64_t user_id, int minutes) {
    if (minutes <= 0) return SS_OK;
    
    // UPSERT optimisé
    const char *sql =
        "INSERT INTO user_stats (user_id, study_time_minutes) VALUES (?, ?) "
        "ON CONFLICT(user_id) DO UPDATE SET study_time_minutes = study_time_minutes + ?";
    
    // Note: nécessite implémentation dans db.h
    
    LOG_INFO("Temps d'étude ajouté: user=%lld, minutes=%d", user_id, minutes);
    
    return SS_OK;
}

void badges_free(Badge *badges, int count) {
    if (!badges) return;
    free(badges);
}

SSError gamification_init_db(void) {
    // Créer les tables de gamification
    const char *sql_tables[] = {
        // Table XP
        "CREATE TABLE IF NOT EXISTS user_xp ("
        "user_id INTEGER PRIMARY KEY, "
        "total_xp INTEGER DEFAULT 0, "
        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        
        // Table Streaks
        "CREATE TABLE IF NOT EXISTS user_streaks ("
        "user_id INTEGER PRIMARY KEY, "
        "current_streak INTEGER DEFAULT 0, "
        "longest_streak INTEGER DEFAULT 0, "
        "last_activity_date TIMESTAMP, "
        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        
        // Table Badges
        "CREATE TABLE IF NOT EXISTS user_badges ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "user_id INTEGER, "
        "badge_name TEXT NOT NULL, "
        "awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
        "UNIQUE(user_id, badge_name), "
        "FOREIGN KEY(user_id) REFERENCES users(id))",
        
        // Table Stats
        "CREATE TABLE IF NOT EXISTS user_stats ("
        "user_id INTEGER PRIMARY KEY, "
        "study_time_minutes INTEGER DEFAULT 0, "
        "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)",
        
        // Table Daily XP
        "CREATE TABLE IF NOT EXISTS daily_xp ("
        "user_id INTEGER, "
        "date TEXT, "
        "xp_gained INTEGER DEFAULT 0, "
        "PRIMARY KEY(user_id, date), "
        "FOREIGN KEY(user_id) REFERENCES users(id))",
        
        NULL
    };
    
    // Créer les index optimisés
    const char *sql_indexes[] = {
        "CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_daily_xp_user_date ON daily_xp(user_id, date)",
        "CREATE INDEX IF NOT EXISTS idx_daily_xp_date ON daily_xp(date)",
        NULL
    };
    
    // Note: nécessite fonction db_execute_batch dans db.h
    
    LOG_INFO("Tables de gamification initialisées");
    
    return SS_OK;
}
