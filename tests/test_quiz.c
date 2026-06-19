/**
 * @file test_quiz.c
 * @brief Tests unitaires pour le module review/quiz.
 */

#include <stdio.h>
#include "unity.h"
#include "review/quiz.h"
#include "db/database.h"
#include "core/error.h"

void test_quiz_create(void) {
    sqlite3 *db = NULL;
    SSError err = db_open(":memory:", &db);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    err = db_migrate(db, "./data/schema.sql");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Créer un utilisateur */
    err = db_exec(db, "INSERT INTO users (username) VALUES ('quizuser');");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Créer un quiz */
    int64_t quiz_id = 0;
    err = quiz_generate(db, 1, 0, 10, "medium", &quiz_id);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_TRUE(quiz_id > 0);

    /* Soumettre une tentative */
    double score = 0.0;
    err = quiz_submit_attempt(db, quiz_id, 1, "[]", &score);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    db_close(db);
}
