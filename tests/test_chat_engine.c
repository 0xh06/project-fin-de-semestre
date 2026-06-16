/**
 * @file test_chat_engine.c
 * @brief Tests unitaires pour le module chat/chat_engine.
 */

#include <string.h>
#include "unity.h"
#include "chat/chat_engine.h"

void test_chat_provider_from_string(void) {
    TEST_ASSERT_EQUAL_INT(AI_PROVIDER_GEMINI, chat_provider_from_string("gemini"));
    
    /* N'importe quoi d'autre retourne Gemini aussi maintenant */
    TEST_ASSERT_EQUAL_INT(AI_PROVIDER_GEMINI, chat_provider_from_string("openai"));
    TEST_ASSERT_EQUAL_INT(AI_PROVIDER_GEMINI, chat_provider_from_string("unknown"));
    TEST_ASSERT_EQUAL_INT(AI_PROVIDER_GEMINI, chat_provider_from_string(NULL));
}
