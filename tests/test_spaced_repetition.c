/**
 * @file test_spaced_repetition.c
 * @brief Tests unitaires pour l'algorithme SM-2.
 */

#include <string.h>
#include "unity.h"
#include "review/spaced_repetition.h"

void test_sm2_quality_perfect(void) {
    Flashcard card = {
        .difficulty = 2.5,
        .interval_days = 1,
        .repetitions = 0,
    };

    /* Première réponse parfaite */
    sm2_update(&card, SM2_QUALITY_PERFECT);
    TEST_ASSERT_EQUAL_INT(1, card.interval_days);
    TEST_ASSERT_EQUAL_INT(1, card.repetitions);

    /* Deuxième réponse parfaite */
    sm2_update(&card, SM2_QUALITY_PERFECT);
    TEST_ASSERT_EQUAL_INT(6, card.interval_days);
    TEST_ASSERT_EQUAL_INT(2, card.repetitions);

    /* Troisième : intervalle * EF */
    sm2_update(&card, SM2_QUALITY_PERFECT);
    TEST_ASSERT_TRUE(card.interval_days > 6);
    TEST_ASSERT_EQUAL_INT(3, card.repetitions);
}

void test_sm2_quality_blackout(void) {
    Flashcard card = {
        .difficulty = 2.5,
        .interval_days = 30,
        .repetitions = 10,
    };

    /* Un blackout réinitialise tout */
    sm2_update(&card, SM2_QUALITY_BLACKOUT);
    TEST_ASSERT_EQUAL_INT(0, card.repetitions);
    TEST_ASSERT_EQUAL_INT(1, card.interval_days);
}

void test_sm2_easiness_never_below_1_3(void) {
    /* Avec une qualité de 0 répétée, le facteur ne doit pas passer sous 1.3 */
    double ef = 2.5;
    for (int i = 0; i < 20; i++) {
        ef = sm2_easiness_factor(ef, SM2_QUALITY_BLACKOUT);
    }
    TEST_ASSERT_TRUE(ef >= 1.3);
}
