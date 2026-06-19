/**
 * @file test_json_helper.c
 * @brief Tests unitaires pour le module utils/json_helper.
 */

#include <stdlib.h>
#include <string.h>
#include "unity.h"
#include "utils/json_helper.h"

void test_json_parse_valid(void) {
    const char *json = "{\"name\": \"SmartStudy\", \"version\": 1}";
    cJSON *root = json_parse(json);
    TEST_ASSERT_NOT_NULL(root);

    TEST_ASSERT_EQUAL_STRING("SmartStudy", json_get_string(root, "name"));
    TEST_ASSERT_EQUAL_INT(1, json_get_int(root, "version", 0));

    cJSON_Delete(root);
}

void test_json_parse_invalid(void) {
    cJSON *root = json_parse("not json at all {{{");
    TEST_ASSERT_NULL(root);
}

void test_json_get_string(void) {
    const char *json = "{\"key\": \"value\", \"num\": 42}";
    cJSON *root = json_parse(json);
    TEST_ASSERT_NOT_NULL(root);

    /* Clé existante */
    TEST_ASSERT_EQUAL_STRING("value", json_get_string(root, "key"));

    /* Clé inexistante */
    TEST_ASSERT_NULL(json_get_string(root, "missing"));

    /* Clé numérique (pas un string) */
    TEST_ASSERT_NULL(json_get_string(root, "num"));

    cJSON_Delete(root);
}


void test_json_build_gemini_payload(void) {
    char *payload = json_build_gemini_payload("Explique le C");
    TEST_ASSERT_NOT_NULL(payload);

    /* Vérifier la structure Gemini */
    TEST_ASSERT_NOT_NULL(strstr(payload, "\"contents\""));
    TEST_ASSERT_NOT_NULL(strstr(payload, "\"parts\""));
    TEST_ASSERT_NOT_NULL(strstr(payload, "Explique le C"));

    free(payload);
}
