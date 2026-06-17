/**
 * @file test_flashcard_srs.c
 * @brief Tests unitaires pour le module flashcard_srs (algorithme SM-2).
 */

#include <string.h>
#include <time.h>
#include "unity.h"
#include "flashcard/flashcard_srs.h"

void test_sm2_first_perfect_response(void) {
    SRSResult result;
    
    /* Première réponse parfaite (quality=5) */
    SSError err = srs_calculate_next_review(5, 0, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(1, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(1, result.new_interval);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 2.6f, result.new_easiness);
}

void test_sm2_second_perfect_response(void) {
    SRSResult result;
    
    /* Deuxième réponse parfaite (quality=5) */
    SSError err = srs_calculate_next_review(5, 1, 2.6f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(2, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(6, result.new_interval);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 2.7f, result.new_easiness);
}

void test_sm2_third_perfect_response(void) {
    SRSResult result;
    
    /* Troisième réponse parfaite (quality=5) - intervalle = précédent * EF */
    SSError err = srs_calculate_next_review(5, 2, 2.7f, 6, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(3, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(16, result.new_interval); /* 6 * 2.7 ≈ 16.2 */
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 2.8f, result.new_easiness);
}

void test_sm2_failure_resets_repetitions(void) {
    SRSResult result;
    
    /* Échec (quality=2) après plusieurs succès */
    SSError err = srs_calculate_next_review(2, 10, 2.5f, 30, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(0, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(1, result.new_interval);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 1.8f, result.new_easiness); /* Diminue */
}

void test_sm2_blackout_resets_all(void) {
    SRSResult result;
    
    /* Blackout total (quality=0) */
    SSError err = srs_calculate_next_review(0, 15, 2.5f, 100, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(0, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(1, result.new_interval);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 1.3f, result.new_easiness); /* Minimum */
}

void test_sm2_easiness_minimum_bound(void) {
    SRSResult result;
    float easiness = 2.5f;
    
    /* Qualité 0 répétée ne doit pas passer sous 1.3 */
    for (int i = 0; i < 20; i++) {
        srs_calculate_next_review(0, 0, easiness, 1, &result);
        easiness = result.new_easiness;
    }
    
    TEST_ASSERT_TRUE(easiness >= 1.3f);
}

void test_sm2_quality_4_good_response(void) {
    SRSResult result;
    
    /* Bonne réponse (quality=4) */
    SSError err = srs_calculate_next_review(4, 2, 2.5f, 6, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(3, result.new_repetitions);
    TEST_ASSERT_TRUE(result.new_interval > 6);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 2.36f, result.new_easiness);
}

void test_sm2_quality_3_hesitant(void) {
    SRSResult result;
    
    /* Réponse hésitante (quality=3) - seuil de succès */
    SSError err = srs_calculate_next_review(3, 1, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_EQUAL_INT(2, result.new_repetitions);
    TEST_ASSERT_EQUAL_INT(6, result.new_interval);
    TEST_ASSERT_FLOAT_WITHIN(0.01f, 2.18f, result.new_easiness);
}

void test_sm2_next_review_timestamp(void) {
    SRSResult result;
    
    SSError err = srs_calculate_next_review(5, 2, 2.5f, 6, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    
    time_t now = time(NULL);
    time_t expected = now + (16 * 86400); /* 16 jours en secondes */
    
    /* Tolérance de 1 seconde */
    TEST_ASSERT_INT64_WITHIN(1, expected, result.next_review_ts);
}

void test_sm2_next_review_date_format(void) {
    SRSResult result;
    
    SSError err = srs_calculate_next_review(5, 0, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    
    /* Vérifier le format YYYY-MM-DD */
    TEST_ASSERT_EQUAL_INT(10, strlen(result.next_review_date));
    TEST_ASSERT_EQUAL_INT('-', result.next_review_date[4]);
    TEST_ASSERT_EQUAL_INT('-', result.next_review_date[7]);
}

void test_sm2_invalid_quality(void) {
    SRSResult result;
    
    /* Qualité hors limites */
    SSError err = srs_calculate_next_review(6, 0, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_ERR_INVALID_PARAM, err);
    
    err = srs_calculate_next_review(-1, 0, 2.5f, 1, &result);
    TEST_ASSERT_EQUAL_INT(SS_ERR_INVALID_PARAM, err);
}

void test_sm2_null_pointer(void) {
    SSError err = srs_calculate_next_review(5, 0, 2.5f, 1, NULL);
    TEST_ASSERT_EQUAL_INT(SS_ERR_INVALID_PARAM, err);
}

void test_sm2_progressive_intervals(void) {
    SRSResult result;
    float easiness = 2.5f;
    int interval = 1;
    int repetitions = 0;
    
    /* Simuler une série de réponses parfaites */
    for (int i = 0; i < 5; i++) {
        srs_calculate_next_review(5, repetitions, easiness, interval, &result);
        
        repetitions = result.new_repetitions;
        interval = result.new_interval;
        easiness = result.new_easiness;
        
        /* Les intervalles doivent croître */
        if (i > 1) {
            TEST_ASSERT_TRUE(interval > 1);
        }
    }
    
    /* Après 5 réponses parfaites, l'intervalle doit être significatif */
    TEST_ASSERT_TRUE(interval > 20);
}

int main(void) {
    UNITY_BEGIN();
    
    RUN_TEST(test_sm2_first_perfect_response);
    RUN_TEST(test_sm2_second_perfect_response);
    RUN_TEST(test_sm2_third_perfect_response);
    RUN_TEST(test_sm2_failure_resets_repetitions);
    RUN_TEST(test_sm2_blackout_resets_all);
    RUN_TEST(test_sm2_easiness_minimum_bound);
    RUN_TEST(test_sm2_quality_4_good_response);
    RUN_TEST(test_sm2_quality_3_hesitant);
    RUN_TEST(test_sm2_next_review_timestamp);
    RUN_TEST(test_sm2_next_review_date_format);
    RUN_TEST(test_sm2_invalid_quality);
    RUN_TEST(test_sm2_null_pointer);
    RUN_TEST(test_sm2_progressive_intervals);
    
    return UNITY_END();
}
