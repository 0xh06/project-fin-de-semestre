/**
 * @file test_gamification.c
 * @brief Tests unitaires pour le système de gamification.
 */

#include <string.h>
#include "unity.h"
#include "gamification/gamification.h"

void test_xp_level_calculation(void) {
    // Test de la formule: level = floor(sqrt(xp / 100))
    
    TEST_ASSERT_EQUAL_INT(0, level_calculate(0));
    TEST_ASSERT_EQUAL_INT(0, level_calculate(99));
    TEST_ASSERT_EQUAL_INT(1, level_calculate(100));
    TEST_ASSERT_EQUAL_INT(1, level_calculate(399));
    TEST_ASSERT_EQUAL_INT(2, level_calculate(400));
    TEST_ASSERT_EQUAL_INT(3, level_calculate(900));
    TEST_ASSERT_EQUAL_INT(10, level_calculate(10000));
}

void test_xp_to_next_level(void) {
    // Test de la formule: (level + 1)^2 * 100
    
    TEST_ASSERT_EQUAL_INT(100, xp_to_next_level(0));
    TEST_ASSERT_EQUAL_INT(400, xp_to_next_level(1));
    TEST_ASSERT_EQUAL_INT(900, xp_to_next_level(2));
    TEST_ASSERT_EQUAL_INT(1600, xp_to_next_level(3));
    TEST_ASSERT_EQUAL_INT(12100, xp_to_next_level(10));
}

void test_streak_increment(void) {
    // Note: nécessite DB initialisée
    // Pour l'instant, test de l'interface
    StreakResult result;
    
    SSError err = streak_check_and_update(1, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
}

void test_streak_reset_after_missed_day(void) {
    // Simuler un streak qui se brise
    // Note: nécessite manipulation de dates en DB
    // Pour l'instant, test de l'interface
    
    StreakResult result;
    SSError err = streak_check_and_update(1, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
}

void test_badge_awarded_once(void) {
    // Vérifier qu'un badge n'est attribué qu'une seule fois
    // Note: nécessite DB initialisée
    // Pour l'instant, test de l'interface
    
    Badge *badges = NULL;
    int count = 0;
    
    SSError err = badge_check_and_award(1, &badges, &count);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    
    if (badges) {
        badges_free(badges, count);
    }
}

void test_xp_add(void) {
    // Test d'ajout d'XP
    // Note: nécessite DB initialisée
    // Pour l'instant, test de l'interface
    
    SSError err = xp_add(1, 50, "Test quiz completion");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
}

void test_stats_get_dashboard(void) {
    // Test de récupération des stats du dashboard
    // Note: nécessite DB initialisée
    // Pour l'instant, test de l'interface
    
    DashboardStats stats;
    
    SSError err = stats_get_dashboard(1, &stats);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(1, stats.user_id);
    TEST_ASSERT_TRUE(stats.xp_total >= 0);
    TEST_ASSERT_TRUE(stats.level >= 0);
}

void test_stats_add_study_time(void) {
    // Test d'ajout de temps d'étude
    // Note: nécessite DB initialisée
    // Pour l'instant, test de l'interface
    
    SSError err = stats_add_study_time(1, 30);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
}

void test_badge_get_user_badges(void) {
    // Test de récupération des badges utilisateur
    // Note: nécessite DB initialisée
    // Pour l'instant, test de l'interface
    
    Badge *badges = NULL;
    int count = 0;
    
    SSError err = badge_get_user_badges(1, &badges, &count);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    
    if (badges) {
        badges_free(badges, count);
    }
}

int main(void) {
    UNITY_BEGIN();

    RUN_TEST(test_xp_level_calculation);
    RUN_TEST(test_xp_to_next_level);
    RUN_TEST(test_streak_increment);
    RUN_TEST(test_streak_reset_after_missed_day);
    RUN_TEST(test_badge_awarded_once);
    RUN_TEST(test_xp_add);
    RUN_TEST(test_stats_get_dashboard);
    RUN_TEST(test_stats_add_study_time);
    RUN_TEST(test_badge_get_user_badges);

    return UNITY_END();
}
