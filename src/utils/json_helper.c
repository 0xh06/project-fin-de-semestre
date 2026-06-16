/**
 * @file json_helper.c
 * @brief Implémentation des utilitaires JSON de haut niveau.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "utils/json_helper.h"
#include "utils/logger.h"

cJSON *json_parse(const char *json_str) {
    if (!json_str) return NULL;

    cJSON *root = cJSON_Parse(json_str);
    if (!root) {
        const char *error_ptr = cJSON_GetErrorPtr();
        if (error_ptr) {
            LOG_ERROR("JSON parse error near: %.30s", error_ptr);
        }
    }
    return root;
}

const char *json_get_string(const cJSON *root, const char *key) {
    if (!root || !key) return NULL;

    cJSON *item = cJSON_GetObjectItemCaseSensitive(root, key);
    if (cJSON_IsString(item) && item->valuestring) {
        return item->valuestring;
    }
    return NULL;
}

int json_get_int(const cJSON *root, const char *key, int default_value) {
    if (!root || !key) return default_value;

    cJSON *item = cJSON_GetObjectItemCaseSensitive(root, key);
    if (cJSON_IsNumber(item)) {
        return item->valueint;
    }
    return default_value;
}

double json_get_double(const cJSON *root, const char *key, double default_value) {
    if (!root || !key) return default_value;

    cJSON *item = cJSON_GetObjectItemCaseSensitive(root, key);
    if (cJSON_IsNumber(item)) {
        return item->valuedouble;
    }
    return default_value;
}


char *json_build_gemini_payload(const char *user_prompt) {
    if (!user_prompt) return NULL;

    /*
     * Format Gemini :
     * {
     *   "contents": [{
     *     "parts": [{"text": "..."}]
     *   }]
     * }
     */

    cJSON *root = cJSON_CreateObject();
    cJSON *contents = cJSON_CreateArray();
    cJSON *content_obj = cJSON_CreateObject();
    cJSON *parts = cJSON_CreateArray();
    cJSON *part = cJSON_CreateObject();

    cJSON_AddStringToObject(part, "text", user_prompt);
    cJSON_AddItemToArray(parts, part);
    cJSON_AddItemToObject(content_obj, "parts", parts);
    cJSON_AddItemToArray(contents, content_obj);
    cJSON_AddItemToObject(root, "contents", contents);

    char *result = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    return result;
}
