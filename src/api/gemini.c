/**
 * @file gemini.c
 * @brief Implémentation du client Google Gemini.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "api/gemini.h"
#include "api/rest_client.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

#define GEMINI_API_BASE "https://generativelanguage.googleapis.com/v1beta/models"

SSError gemini_chat(const char *api_key,
                    const char *model,
                    const char *system_prompt,
                    const char *user_prompt,
                    AIResponse *response) {
    if (!api_key || !user_prompt || !response) return SS_ERR_NULL_PTR;

    memset(response, 0, sizeof(AIResponse));

    const char *mdl = model ? model : "gemini-2.0-flash";

    /* Construire l'URL avec la clé API en paramètre de query */
    char url[512];
    snprintf(url, sizeof(url), "%s/%s:generateContent?key=%s",
             GEMINI_API_BASE, mdl, api_key);

    /* Construire le prompt complet (system + user) */
    char *full_prompt = NULL;
    if (system_prompt) {
        size_t len = strlen(system_prompt) + strlen(user_prompt) + 16;
        full_prompt = malloc(len);
        if (!full_prompt) return SS_ERR_ALLOC;
        snprintf(full_prompt, len, "%s\n\n%s", system_prompt, user_prompt);
    }

    char *payload = json_build_gemini_payload(full_prompt ? full_prompt : user_prompt);
    free(full_prompt);
    if (!payload) return SS_ERR_JSON_BUILD;

    /* Appel HTTP (pas de Bearer pour Gemini, clé dans l'URL) */
    HttpResponse http_resp;
    SSError err = http_post_json(url, payload, NULL, 0, &http_resp);
    free(payload);

    if (err != SS_OK) {
        http_response_free(&http_resp);
        return err;
    }

    /* Parser la réponse */
    cJSON *root = json_parse(http_resp.body.data);
    if (!root) {
        http_response_free(&http_resp);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *candidates = cJSON_GetObjectItem(root, "candidates");
    if (cJSON_IsArray(candidates) && cJSON_GetArraySize(candidates) > 0) {
        cJSON *first   = cJSON_GetArrayItem(candidates, 0);
        cJSON *content = cJSON_GetObjectItem(first, "content");
        cJSON *parts   = cJSON_GetObjectItem(content, "parts");
        if (cJSON_IsArray(parts) && cJSON_GetArraySize(parts) > 0) {
            cJSON *part = cJSON_GetArrayItem(parts, 0);
            const char *text = json_get_string(part, "text");
            if (text) response->content = strdup(text);
        }
    }

    /* Tokens (si disponibles) */
    cJSON *usage = cJSON_GetObjectItem(root, "usageMetadata");
    if (usage) {
        response->prompt_tokens     = json_get_int(usage, "promptTokenCount", 0);
        response->completion_tokens = json_get_int(usage, "candidatesTokenCount", 0);
    }

    cJSON_Delete(root);
    http_response_free(&http_resp);

    return response->content ? SS_OK : SS_ERR_HTTP_RESPONSE;
}

void ai_response_free(AIResponse *response) {
    if (response) {
        free(response->content);
        response->content = NULL;
    }
}
