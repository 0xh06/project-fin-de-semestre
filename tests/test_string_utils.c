/**
 * @file test_string_utils.c
 * @brief Tests unitaires pour le module utils/string_utils.
 */

#include <stdlib.h>
#include <string.h>
#include "unity.h"
#include "utils/string_utils.h"

void test_str_dup(void) {
    char *copy = str_dup("hello");
    TEST_ASSERT_NOT_NULL(copy);
    TEST_ASSERT_EQUAL_STRING("hello", copy);
    free(copy);

    /* NULL → NULL */
    TEST_ASSERT_NULL(str_dup(NULL));
}

void test_str_trim(void) {
    char buf1[] = "  hello  ";
    char *trimmed = str_trim(buf1);
    TEST_ASSERT_EQUAL_STRING("hello", trimmed);

    char buf2[] = "\t\n  spaced \n\t";
    trimmed = str_trim(buf2);
    TEST_ASSERT_EQUAL_STRING("spaced", trimmed);

    char buf3[] = "no_spaces";
    trimmed = str_trim(buf3);
    TEST_ASSERT_EQUAL_STRING("no_spaces", trimmed);

    char buf4[] = "   ";
    trimmed = str_trim(buf4);
    TEST_ASSERT_EQUAL_STRING("", trimmed);
}

void test_str_is_empty(void) {
    TEST_ASSERT_TRUE(str_is_empty(NULL));
    TEST_ASSERT_TRUE(str_is_empty(""));
    TEST_ASSERT_FALSE(str_is_empty("a"));
    TEST_ASSERT_FALSE(str_is_empty(" "));  /* un espace n'est pas "vide" */
}

void test_str_concat(void) {
    char *result = str_concat("Hello, ", "World!");
    TEST_ASSERT_NOT_NULL(result);
    TEST_ASSERT_EQUAL_STRING("Hello, World!", result);
    free(result);

    /* Cas NULL */
    result = str_concat(NULL, "only");
    TEST_ASSERT_EQUAL_STRING("only", result);
    free(result);

    result = str_concat("only", NULL);
    TEST_ASSERT_EQUAL_STRING("only", result);
    free(result);
}

void test_str_truncate(void) {
    /* Pas de troncature si assez court */
    char *result = str_truncate("short", 10);
    TEST_ASSERT_EQUAL_STRING("short", result);
    free(result);

    /* Troncature avec "..." */
    result = str_truncate("Un texte très long qui devrait être coupé", 10);
    TEST_ASSERT_NOT_NULL(result);
    TEST_ASSERT_TRUE(strlen(result) == 13); /* 10 + "..." */
    TEST_ASSERT_EQUAL_STRING("Un texte t...", result);
    free(result);
}
