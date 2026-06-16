/**
 * @file flashcard.h
 * @brief Gestion des flashcards et decks.
 *
 * CRUD sur les decks et cartes, génération automatique via IA
 * à partir du contenu d'un document.
 */

#ifndef SMARTSTUDY_REVIEW_FLASHCARD_H
#define SMARTSTUDY_REVIEW_FLASHCARD_H

#include <sqlite3.h>
#include "core/error.h"
#include "db/models.h"

/**
 * Crée un nouveau deck de flashcards.
 * @param db           Handle SQLite.
 * @param user_id      ID de l'utilisateur.
 * @param name         Nom du deck.
 * @param document_id  ID du document source (0 si manuel).
 * @param deck_id      Pointeur de sortie pour l'ID du deck créé.
 * @return SS_OK ou code d'erreur.
 */
SSError flashcard_create_deck(sqlite3 *db,
                              int64_t user_id,
                              const char *name,
                              int64_t document_id,
                              int64_t *deck_id);

/**
 * Ajoute une flashcard à un deck.
 * @param db       Handle SQLite.
 * @param deck_id  ID du deck.
 * @param front    Texte recto (question).
 * @param back     Texte verso (réponse).
 * @param card_id  Pointeur de sortie pour l'ID de la carte créée.
 * @return SS_OK ou code d'erreur.
 */
SSError flashcard_add(sqlite3 *db,
                      int64_t deck_id,
                      const char *front,
                      const char *back,
                      int64_t *card_id);

/**
 * Récupère les cartes à réviser aujourd'hui pour un deck donné.
 * @param db        Handle SQLite.
 * @param deck_id   ID du deck.
 * @param cards     Tableau de sortie (alloué par la fonction, à free).
 * @param count     Nombre de cartes retournées.
 * @return SS_OK ou code d'erreur.
 */
SSError flashcard_get_due(sqlite3 *db,
                          int64_t deck_id,
                          Flashcard **cards,
                          int *count);

/**
 * Génère automatiquement des flashcards via l'IA à partir de texte.
 * @param db           Handle SQLite.
 * @param deck_id      ID du deck cible.
 * @param source_text  Texte source (extrait d'un document).
 * @param max_cards    Nombre max de cartes à générer.
 * @param generated    Nombre de cartes effectivement générées.
 * @return SS_OK ou code d'erreur.
 */
SSError flashcard_generate_from_text(sqlite3 *db,
                                     int64_t deck_id,
                                     const char *source_text,
                                     int max_cards,
                                     int *generated);

#endif /* SMARTSTUDY_REVIEW_FLASHCARD_H */
