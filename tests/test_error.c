/**
 * @file test_error.c
 * @brief Tests unitaires pour le module core/error.
 */

#include "unity.h"
#include "core/error.h"
#include <string.h>

void test_error_str_returns_valid_strings(void) {
    /* Vérifier que chaque code a une description non vide */
    TEST_ASSERT_NOT_NULL(ss_error_str(SS_OK));
    TEST_ASSERT_NOT_NULL(ss_error_str(SS_ERR_GENERIC));
    TEST_ASSERT_NOT_NULL(ss_error_str(SS_ERR_NULL_PTR));
    TEST_ASSERT_NOT_NULL(ss_error_str(SS_ERR_DB_OPEN));
    TEST_ASSERT_NOT_NULL(ss_error_str(SS_ERR_JSON_PARSE));
    TEST_ASSERT_NOT_NULL(ss_error_str(SS_ERR_HTTP_REQUEST));
    TEST_ASSERT_NOT_NULL(ss_error_str(SS_ERR_PDF_OPEN));

    /* Le code inconnu doit aussi retourner quelque chose */
    TEST_ASSERT_NOT_NULL(ss_error_str((SSError)999));

    /* Vérifier que SS_OK retourne "Succès" */
    TEST_ASSERT_EQUAL_STRING("Succès", ss_error_str(SS_OK));
}
