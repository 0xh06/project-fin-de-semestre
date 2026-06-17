/**
 * @file test_srs.c
 * @brief Tests unitaires pour l'algorithme SM-2 de répétition espacée.
 */

#include <string.h>
#include "unity.h"
#include "flashcard/flashcard_srs.h"

void test_sm2_first_review_quality_5(void) {
    SRSResult result;
    
    SSError err = srs_calculate_next_review(5, 0, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(1, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(1, result.new_interval);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 2.6f, result.new_easiness);
}

void test_sm2_first_review_quality_1(void) {
    SRSResult result;
    
    SSError err = srs_calculate_next_review(1, 0, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(0, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(1, result.new_interval);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 1.8f, result.new_easiness);
}

void test_sm2_third_repetition(void) {
    SRSResult result;
    
    // Après 2 répétitions réussies, intervalle = 6
    SSError err = srs_calculate_next_review(5, 2, 2.7f, 6, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(3, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(16, result.new_interval); // 6 * 2.7 ≈ 16.2
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 2.8f, result.new_easiness);
}

void test_sm2_minimum_easiness(void) {
    SRSResult result;
    float easiness = 2.5f;
    
    // Qualité 0 répétée ne doit pas passer sous 1.3
    for (int i = 0; i < 20; i++) {
        srs_calculate_next_review(0, 0, easiness, 1, &result);
        easiness = result.new_easiness;
    }
    
    TEST_ASSERT_TRUE(easiness >= 1.3f);
}

void test_sm2_quality_below_3_resets(void) {
    SRSResult result;
    
    // Qualité 2 après plusieurs succès
    SSError err = srs_calculate_next_review(2, 10, 2.5f, 30, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(0, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(1, result.new_interval);
}

void test_due_cards_returns_correct_count(void) {
    // Note: nécessite DB initialisée
    // Pour l'instant, test de l'interface
    DBFlashcard *cards = NULL;
    int count = 0;
    
    SSError err = flashcard_get_due_today(1, &cards, &count);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    
    flashcard_list_free(cards, count);
}

void test_sm2_progressive_intervals(void) {
    SRSResult result;
    float easiness = 2.5f;
    int interval = 1;
    int repetitions = 0;
    
    // Simuler une série de réponses parfaites
    for (int i = 0; i < 5; i++) {
        srs_calculate_next_review(5, repetitions, easiness, interval, &result);
        
        repetitions = result.new_repetitions;
        interval = result.new_interval;
        easiness = result.new_easiness;
        
        if (i > 1) {
            TEST_ASSERT_TRUE(interval > 1);
        }
    }
    
    // Après 5 réponses parfaites, l'intervalle doit être significatif
    TEST_ASSERT_TRUE(interval > 20);
}

void test_sm2_next_review_timestamp(void) {
    SRSResult result;
    
    SSError err = srs_calculate_next_review(5, 2, 2.5f, 6, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    
    time_t now = time(NULL);
    time_t expected = now + (16 * 86400); // 16 jours en secondes
    
    TEST_ASSERT_INT64_WITHIN(1, expected, result.next_review_ts);
}

void test_sm2_invalid_quality(void) {
    SRSResult result;
    
    SSError err = srs_calculate_next_review(6, 0, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_ERR_INVALID_PARAM, err);
    
    err = srs_calculate_next_review(-1, 0, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_ERR_INVALID_PARAM, err);
}

void test_sm2_null_pointer(void) {
    SSError err = srs_calculate_next_review(5, 0, 2.5f, 1, NULL);
    TEST_ASSERT_EQUAL_INT(SS_ERR_INVALID_PARAM, err);
}

int main(void) {
    UNITY_BEGIN();

    RUN_TEST(test_sm2_first_review_quality_5);
    RUN_TEST(test_sm2_first_review_quality_1);
    RUN_TEST(test_sm2_third_repetition);
    RUN_TEST(test_sm2_minimum_easiness);
    RUN_TEST(test_sm2_quality_below_3_resets);
    RUN_TEST(test_due_cards_returns_correct_count);
    RUN_TEST(test_sm2_progressive_intervals);
    RUN_TEST(test_sm2_next_review_timestamp);
    RUN_TEST(test_sm2_invalid_quality);
    RUN_TEST(test_sm2_null_pointer);

    return UNITY_END();
}
