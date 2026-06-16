/**
 * @file test_rest_client.c
 * @brief Tests unitaires pour le module api/rest_client.
 */

#include "unity.h"
#include "api/rest_client.h"
#include "core/error.h"

void test_rest_client_init_cleanup(void) {
    /* Test d'initialisation/nettoyage sans crash */
    SSError err = http_init();
    TEST_ASSERT_EQUAL_INT(SS_OK, err);

    http_cleanup();

    /* Double init doit aussi fonctionner */
    err = http_init();
    TEST_ASSERT_EQUAL_INT(SS_OK, err);
    http_cleanup();
}

/* Note: les tests d'appels HTTP réels (POST/GET) nécessitent un serveur mock
 * et sont plutôt des tests d'intégration. */
