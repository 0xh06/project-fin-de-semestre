/**
 * @file string_utils.c
 * @brief Implémentation des utilitaires de chaînes.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "utils/string_utils.h"

char *str_dup(const char *str) {
    if (!str) return NULL;
    size_t len = strlen(str) + 1;
    char *copy = malloc(len);
    if (copy) memcpy(copy, str, len);
    return copy;
}

char *str_trim(char *str) {
    if (!str) return NULL;

    /* Trim début */
    while (isspace((unsigned char)*str)) str++;

    if (*str == '\0') return str;

    /* Trim fin */
    char *end = str + strlen(str) - 1;
    while (end > str && isspace((unsigned char)*end)) end--;
    end[1] = '\0';

    return str;
}

int str_is_empty(const char *str) {
    return (!str || *str == '\0');
}

char *str_concat(const char *a, const char *b) {
    if (!a && !b) return NULL;
    if (!a) return str_dup(b);
    if (!b) return str_dup(a);

    size_t len_a = strlen(a);
    size_t len_b = strlen(b);
    char *result = malloc(len_a + len_b + 1);
    if (!result) return NULL;

    memcpy(result, a, len_a);
    memcpy(result + len_a, b, len_b + 1);
    return result;
}

char *str_truncate(const char *str, size_t max_len) {
    if (!str) return NULL;

    size_t len = strlen(str);
    if (len <= max_len) return str_dup(str);

    char *result = malloc(max_len + 4); /* +4 pour "..." + '\0' */
    if (!result) return NULL;

    memcpy(result, str, max_len);
    result[max_len]     = '.';
    result[max_len + 1] = '.';
    result[max_len + 2] = '.';
    result[max_len + 3] = '\0';
    return result;
}
