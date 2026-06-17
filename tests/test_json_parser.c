/**
 * @file test_json_parser.c
 * @brief Tests unitaires pour utils/json_parser.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "unity.h"
#include "utils/json_parser.h"

void test_json_parser_openai_valid(void) {
    const char *json =
        "{"
        "\"choices\":[{\"message\":{\"content\":\"Bonjour\"}}],"
        "\"usage\":{\"total_tokens\":42}"
        "}";

    char *content = NULL;
    int tokens = 0;
    SSError err = json_parse_openai_response(json, &content, &tokens);

    TEST_ASSERT_EQUAL(SS_OK, err);
    TEST_ASSERT_NOT_NULL(content);
    TEST_ASSERT_EQUAL_STRING("Bonjour", content);
    TEST_ASSERT_EQUAL_INT(42, tokens);

    free(content);
}

void test_json_parser_gemini_valid(void) {
    const char *json =
        "{"
        "\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"Salut Gemini\"}]}}]"
        "}";

    char *content = NULL;
    SSError err = json_parse_gemini_response(json, &content);

    TEST_ASSERT_EQUAL(SS_OK, err);
    TEST_ASSERT_NOT_NULL(content);
    TEST_ASSERT_EQUAL_STRING("Salut Gemini", content);

    free(content);
}

void test_json_parser_mistral_valid(void) {
    const char *json =
        "{"
        "\"choices\":[{\"message\":{\"content\":\"Réponse Mistral\"}}],"
        "\"usage\":{\"total_tokens\":18}"
        "}";

    char *content = NULL;
    int tokens = 0;
    SSError err = json_parse_mistral_response(json, &content, &tokens);

    TEST_ASSERT_EQUAL(SS_OK, err);
    TEST_ASSERT_NOT_NULL(content);
    TEST_ASSERT_EQUAL_STRING("Réponse Mistral", content);
    TEST_ASSERT_EQUAL_INT(18, tokens);

    free(content);
}

void test_json_parser_empty_response(void) {
    char *content = NULL;
    int tokens = 0;
    SSError err = json_parse_openai_response("{}", &content, &tokens);

    TEST_ASSERT_EQUAL(SS_ERR_JSON_PARSE, err);
    TEST_ASSERT_NULL(content);
    TEST_ASSERT_EQUAL_INT(0, tokens);
}

void test_json_parser_api_error(void) {
    const char *json = "{\"error\":{\"message\":\"Unauthorized\"}}";
    char *content = NULL;
    int tokens = 0;
    SSError err = json_parse_openai_response(json, &content, &tokens);

    TEST_ASSERT_EQUAL(SS_ERR_HTTP_RESPONSE, err);
    TEST_ASSERT_NULL(content);
    TEST_ASSERT_EQUAL_INT(0, tokens);
}

void test_json_parser_missing_total_tokens(void) {
    const char *json =
        "{"
        "\"choices\":[{\"message\":{\"content\":\"Hello\"}}]"
        "}";

    char *content = NULL;
    int tokens = 0;
    SSError err = json_parse_openai_response(json, &content, &tokens);

    TEST_ASSERT_EQUAL(SS_ERR_JSON_PARSE, err);
    TEST_ASSERT_NULL(content);
    TEST_ASSERT_EQUAL_INT(0, tokens);
}

void test_json_parser_malformed_json(void) {
    char *content = NULL;
    int tokens = 0;
    SSError err = json_parse_openai_response("{ not valid", &content, &tokens);

    TEST_ASSERT_EQUAL(SS_ERR_JSON_PARSE, err);
    TEST_ASSERT_NULL(content);
    TEST_ASSERT_EQUAL_INT(0, tokens);
}

void test_json_parser_build_openai_request(void) {
    Message messages[] = {
        {"system", "Tu es utile"},
        {"user", "Explique le C"},
    };

    char *json = build_openai_request(messages, 2, "gpt-4o-mini");
    TEST_ASSERT_NOT_NULL(json);
    TEST_ASSERT_NOT_NULL(strstr(json, "\"model\":\"gpt-4o-mini\""));
    TEST_ASSERT_NOT_NULL(strstr(json, "\"messages\""));
    TEST_ASSERT_NOT_NULL(strstr(json, "Explique le C"));

    free(json);
}

void test_json_parser_build_messages_array(void) {
    ChatMessage history[2];
    memset(history, 0, sizeof(history));
    snprintf(history[0].role, sizeof(history[0].role), "%s", "user");
    history[0].content = "Bonjour";
    snprintf(history[1].role, sizeof(history[1].role), "%s", "assistant");
    history[1].content = "Salut";

    cJSON *array = build_messages_array("Tu es SmartStudy", history, 2);
    TEST_ASSERT_NOT_NULL(array);

    char *printed = cJSON_PrintUnformatted(array);
    TEST_ASSERT_NOT_NULL(printed);
    TEST_ASSERT_NOT_NULL(strstr(printed, "Tu es SmartStudy"));
    TEST_ASSERT_NOT_NULL(strstr(printed, "Bonjour"));
    TEST_ASSERT_NOT_NULL(strstr(printed, "Salut"));

    free(printed);
    cJSON_Delete(array);
}