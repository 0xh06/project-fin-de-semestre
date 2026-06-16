/**
 * @file test_tracker.c
 * @brief Tests unitaires pour le module progress/tracker.
 */

#include <stdio.h>
#include "unity.h"
#include "progress/tracker.h"
#include "db/database.h"
#include "core/error.h"

void test_tracker_start_end_session(void) {
    sqlite3 *db = NULL;
    SSError err = db_open(":memory:", &db);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    err = db_migrate(db, "./data/schema.sql");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Créer un utilisateur */
    err = db_exec(db, "INSERT INTO users (username) VALUES ('tracker_user');");
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Démarrer une session */
    int64_t session_id = 0;
    err = tracker_start_session(db, 1, 0, "reading", &session_id);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    TEST_ASSERT_TRUE(session_id > 0);

    /* Terminer la session */
    err = tracker_end_session(db, session_id);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    /* Vérifier les stats (devraient être initialisées) */
    ProgressStats stats;
    err = tracker_get_stats(db, 1, &stats);
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    db_close(db);
}
