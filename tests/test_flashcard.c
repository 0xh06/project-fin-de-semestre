/**
 * @file test_flashcard.c
 * @brief Tests unitaires pour le module review/flashcard.
 */

#include <stdio.h>
#include "unity.h"
#include "review/flashcard.h"
#include "db/database.h"
#include "core/error.h"

void test_flashcard_create_deck(void) {
    sqlite3 *db = NULL;
    SSError err = db_open(":memory:", &db);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Appliquer le schéma */
    err = db_migrate(db, "./data/schema.sql");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Créer un utilisateur d'abord */
    err = db_exec(db, "INSERT INTO users (username) VALUES ('testuser');");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Créer un deck */
    int64_t deck_id = 0;
    err = flashcard_create_deck(db, 1, "Mon Deck", 0, &deck_id);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_TRUE(deck_id > 0);

    /* Ajouter une carte */
    int64_t card_id = 0;
    err = flashcard_add(db, deck_id, "Qu'est-ce que le C ?",
                        "Un langage de programmation compilé", &card_id);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_TRUE(card_id > 0);

    db_close(db);
}
