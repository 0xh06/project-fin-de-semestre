/**
 * @file test_rest_client.c
 * @brief Test de fumée pour l'ancienne couche REST.
 */

#include "unity.h"
#include "api/rest_client.h"

void test_rest_client_init_cleanup(void) {
    TEST_ASSERT_EQUAL(SS_OK, http_init());
    http_cleanup();
}
