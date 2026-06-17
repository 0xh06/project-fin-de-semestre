/**
 * @file json_parser.c
 * @brief Parsing et construction JSON pour les providers IA.
 */

#include <stdlib.h>
#include <string.h>
#include "utils/json_parser.h"
#include "utils/string_utils.h"
#include "utils/logger.h"

static void free_and_null(char **value) {
    if (!value) return;
    free(*value);
    *value = NULL;
}

static int is_valid_cstring(const char *value) {
    return value != NULL;
}

static int copy_cjson_string(cJSON *item, char **out) {
    const char *text = cJSON_IsString(item) ? item->valuestring : NULL;
    if (!text) return 0;

    char *copy = str_dup(text);
    if (!copy) return 0;

    *out = copy;
    return 1;
}

static cJSON *get_required_object(cJSON *parent, const char *key) {
    cJSON *item = cJSON_GetObjectItemCaseSensitive(parent, key);
    return cJSON_IsObject(item) ? item : NULL;
}

static cJSON *get_required_array(cJSON *parent, const char *key) {
    cJSON *item = cJSON_GetObjectItemCaseSensitive(parent, key);
    return cJSON_IsArray(item) ? item : NULL;
}

static SSError parse_openai_like_response(const char *json_str,
                                          char **content_out,
                                          int *total_tokens_out) {
    if (!json_str || !content_out || !total_tokens_out) return SS_ERR_NULL_PTR;

    *content_out = NULL;
    *total_tokens_out = 0;

    cJSON *root = cJSON_Parse(json_str);
    if (!root) {
        LOG_ERROR("JSON parse error for OpenAI/Mistral response");
        return SS_ERR_JSON_PARSE;
    }

    if (cJSON_GetObjectItemCaseSensitive(root, "error") != NULL) {
        cJSON_Delete(root);
        return SS_ERR_HTTP_RESPONSE;
    }

    cJSON *choices = get_required_array(root, "choices");
    if (!choices || cJSON_GetArraySize(choices) <= 0) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *first_choice = cJSON_GetArrayItem(choices, 0);
    if (!cJSON_IsObject(first_choice)) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *message = get_required_object(first_choice, "message");
    if (!message) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *content_item = cJSON_GetObjectItemCaseSensitive(message, "content");
    if (!copy_cjson_string(content_item, content_out)) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *usage = get_required_object(root, "usage");
    if (!usage) {
        free_and_null(content_out);
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *total_tokens = cJSON_GetObjectItemCaseSensitive(usage, "total_tokens");
    if (!cJSON_IsNumber(total_tokens)) {
        free_and_null(content_out);
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    *total_tokens_out = total_tokens->valueint;
    cJSON_Delete(root);
    return SS_OK;
}

static SSError parse_gemini_like_response(const char *json_str, char **content_out) {
    if (!json_str || !content_out) return SS_ERR_NULL_PTR;

    *content_out = NULL;

    cJSON *root = cJSON_Parse(json_str);
    if (!root) {
        LOG_ERROR("JSON parse error for Gemini response");
        return SS_ERR_JSON_PARSE;
    }

    if (cJSON_GetObjectItemCaseSensitive(root, "error") != NULL) {
        cJSON_Delete(root);
        return SS_ERR_HTTP_RESPONSE;
    }

    cJSON *candidates = get_required_array(root, "candidates");
    if (!candidates || cJSON_GetArraySize(candidates) <= 0) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *first_candidate = cJSON_GetArrayItem(candidates, 0);
    if (!cJSON_IsObject(first_candidate)) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *content = get_required_object(first_candidate, "content");
    if (!content) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *parts = get_required_array(content, "parts");
    if (!parts || cJSON_GetArraySize(parts) <= 0) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *first_part = cJSON_GetArrayItem(parts, 0);
    if (!cJSON_IsObject(first_part)) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *text_item = cJSON_GetObjectItemCaseSensitive(first_part, "text");
    if (!copy_cjson_string(text_item, content_out)) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON_Delete(root);
    return SS_OK;
}

static cJSON *create_message_object(const char *role, const char *content) {
    if (!is_valid_cstring(role) || !is_valid_cstring(content)) {
        return NULL;
    }

    cJSON *message = cJSON_CreateObject();
    if (!message) return NULL;

    if (!cJSON_AddStringToObject(message, "role", role) ||
        !cJSON_AddStringToObject(message, "content", content)) {
        cJSON_Delete(message);
        return NULL;
    }

    return message;
}

static cJSON *create_chat_message_from_history(const ChatMessage *entry) {
    if (!entry) return NULL;
    return create_message_object(entry->role, entry->content);
}

static cJSON *create_message_from_request(const Message *entry) {
    if (!entry) return NULL;
    return create_message_object(entry->role, entry->content);
}

SSError json_parse_openai_response(const char *json_str, char **content_out, int *total_tokens_out) {
    return parse_openai_like_response(json_str, content_out, total_tokens_out);
}

SSError json_parse_mistral_response(const char *json_str, char **content_out, int *total_tokens_out) {
    return parse_openai_like_response(json_str, content_out, total_tokens_out);
}

SSError json_parse_gemini_response(const char *json_str, char **content_out) {
    return parse_gemini_like_response(json_str, content_out);
}

char *build_openai_request(Message *messages, int count, const char *model) {
    if (!messages || count <= 0 || !model) return NULL;

    cJSON *root = cJSON_CreateObject();
    cJSON *arr = cJSON_CreateArray();
    if (!root || !arr) {
        cJSON_Delete(root);
        cJSON_Delete(arr);
        return NULL;
    }

    if (!cJSON_AddStringToObject(root, "model", model)) {
        cJSON_Delete(root);
        cJSON_Delete(arr);
        return NULL;
    }

    for (int i = 0; i < count; ++i) {
        cJSON *message = create_message_from_request(&messages[i]);
        if (!message) {
            cJSON_Delete(root);
            cJSON_Delete(arr);
            return NULL;
        }
        cJSON_AddItemToArray(arr, message);
    }

    if (!cJSON_AddItemToObject(root, "messages", arr)) {
        cJSON_Delete(root);
        cJSON_Delete(arr);
        return NULL;
    }

    char *result = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    return result;
}

cJSON *build_messages_array(const char *system_prompt, ChatMessage *history, int history_len) {
    if (history_len < 0) return NULL;
    if (history_len > 0 && !history) return NULL;

    cJSON *messages = cJSON_CreateArray();
    if (!messages) return NULL;

    if (system_prompt) {
        cJSON *system_message = create_message_object("system", system_prompt);
        if (!system_message) {
            cJSON_Delete(messages);
            return NULL;
        }
        cJSON_AddItemToArray(messages, system_message);
    }

    for (int i = 0; i < history_len; ++i) {
        cJSON *message = create_chat_message_from_history(&history[i]);
        if (!message) {
            cJSON_Delete(messages);
            return NULL;
        }
        cJSON_AddItemToArray(messages, message);
    }

    return messages;
}