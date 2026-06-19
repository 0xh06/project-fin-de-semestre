/**
 * @file json_parser.h
 * @brief Parsing et construction JSON pour les réponses et requêtes IA.
 */

#ifndef SMARTSTUDY_UTILS_JSON_PARSER_H
#define SMARTSTUDY_UTILS_JSON_PARSER_H

#include "cJSON/cJSON.h"
#include "core/error.h"
#include "db/models.h"

typedef struct {
    const char *role;
    const char *content;
} Message;

SSError json_parse_openai_response(const char *json_str, char **content_out, int *total_tokens_out);
SSError json_parse_gemini_response(const char *json_str, char **content_out);
SSError json_parse_mistral_response(const char *json_str, char **content_out, int *total_tokens_out);

char *build_openai_request(Message *messages, int count, const char *model);
cJSON *build_messages_array(const char *system_prompt, ChatMessage *history, int history_len);

#endif /* SMARTSTUDY_UTILS_JSON_PARSER_H */