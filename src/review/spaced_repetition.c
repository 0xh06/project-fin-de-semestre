/**
 * @file spaced_repetition.c
 * @brief Implémentation de l'algorithme SM-2 (SuperMemo 2).
 */

#include <string.h>
#include <stdio.h>
#include <time.h>
#include "review/spaced_repetition.h"

double sm2_easiness_factor(double current_ef, SM2Quality quality) {
    /* Formule SM-2 :
     * EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
     * Le facteur ne descend jamais en dessous de 1.3
     */
    int q = (int)quality;
    double new_ef = current_ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (new_ef < 1.3) new_ef = 1.3;
    return new_ef;
}

void sm2_update(Flashcard *card, SM2Quality quality) {
    if (!card) return;

    if (quality >= SM2_QUALITY_OK) {
        /* Réponse correcte : augmenter l'intervalle */
        if (card->repetitions == 0) {
            card->interval_days = 1;
        } else if (card->repetitions == 1) {
            card->interval_days = 6;
        } else {
            card->interval_days = (int)(card->interval_days * card->difficulty);
        }
        card->repetitions++;
    } else {
        /* Réponse incorrecte : réinitialiser */
        card->repetitions = 0;
        card->interval_days = 1;
    }

    /* Mettre à jour le facteur de facilité */
    card->difficulty = sm2_easiness_factor(card->difficulty, quality);

    /* Calculer la prochaine date de révision */
    time_t now = time(NULL);
    struct tm *tm_next = localtime(&now);
    tm_next->tm_mday += card->interval_days;
    mktime(tm_next); /* Normalise la date */

    snprintf(card->next_review, sizeof(card->next_review),
             "%04d-%02d-%02d",
             tm_next->tm_year + 1900,
             tm_next->tm_mon + 1,
             tm_next->tm_mday);
}
