/**
 * @file test_database.c
 * @brief Tests unitaires pour le module db/database.
 */

#include <stdio.h>
#include "unity.h"
#include "db/database.h"
#include "core/error.h"

void test_db_open_close(void) {
    sqlite3 *db = NULL;

    /* Ouvrir une base en mémoire */
    SSError err = db_open(":memory:", &db);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_NOT_NULL(db);

    /* Fermer */
    db_close(db);
}

void test_db_migrate(void) {
    sqlite3 *db = NULL;
    SSError err = db_open(":memory:", &db);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Appliquer le schéma */
    err = db_migrate(db, "./data/schema.sql");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Vérifier qu'une table existe */
    err = db_exec(db, "SELECT COUNT(*) FROM users;");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Vérifier une autre table */
    err = db_exec(db, "SELECT COUNT(*) FROM flashcards;");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    db_close(db);
}
