/**
 * @file spaced_repetition.h
 * @brief Algorithme de répétition espacée SM-2.
 *
 * Implémente l'algorithme SuperMemo 2 pour calculer les intervalles
 * de révision optimaux en fonction de la qualité de la réponse.
 */

#ifndef SMARTSTUDY_REVIEW_SPACED_REPETITION_H
#define SMARTSTUDY_REVIEW_SPACED_REPETITION_H

#include "db/models.h"

/**
 * Qualité de la réponse (échelle SM-2 : 0 à 5).
 *   0 = Aucun souvenir (blackout total)
 *   1 = Mauvais (réponse incorrecte, l'indice rappelle vaguement)
 *   2 = Difficile (réponse incorrecte mais proche)
 *   3 = Passable (réponse correcte avec difficulté)
 *   4 = Bien (réponse correcte après hésitation)
 *   5 = Parfait (réponse correcte immédiate)
 */
typedef enum {
    SM2_QUALITY_BLACKOUT   = 0,
    SM2_QUALITY_BAD        = 1,
    SM2_QUALITY_HARD       = 2,
    SM2_QUALITY_OK         = 3,
    SM2_QUALITY_GOOD       = 4,
    SM2_QUALITY_PERFECT    = 5,
} SM2Quality;

/**
 * Met à jour les paramètres SM-2 d'une flashcard après une révision.
 * Modifie en place : difficulty, interval_days, repetitions, next_review.
 * @param card    Flashcard à mettre à jour.
 * @param quality Qualité de la réponse (0-5).
 */
void sm2_update(Flashcard *card, SM2Quality quality);

/**
 * Calcule le facteur de facilité mis à jour.
 * @param current_ef  Facteur actuel (>= 1.3).
 * @param quality     Qualité de la réponse.
 * @return Nouveau facteur de facilité.
 */
double sm2_easiness_factor(double current_ef, SM2Quality quality);

#endif /* SMARTSTUDY_REVIEW_SPACED_REPETITION_H */
