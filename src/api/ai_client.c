/**
 * @file ai_client.c
 * @brief Implémentation du client IA haut niveau pour Gemini.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "api/ai_client.h"
#include "api/http_client.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

#define GEMINI_API_BASE "https://generativelanguage.googleapis.com/v1beta/models"
#define GEMINI_DEFAULT_MODEL "gemini-2.0-flash"

SSError gemini_generate(const char *prompt, char **response_json_out) {
    if (!prompt || !response_json_out) return SS_ERR_NULL_PTR;

    *response_json_out = NULL;

    const char *api_key = getenv("GEMINI_API_KEY");
    if (!api_key || *api_key == '\0') {
        LOG_ERROR("GEMINI_API_KEY manquante");
        return SS_ERR_API_AUTH;
    }

    const char *model = getenv("GEMINI_MODEL");
    if (!model || *model == '\0') {
        model = GEMINI_DEFAULT_MODEL;
    }

    char url[768];
    snprintf(url, sizeof(url), "%s/%s:generateContent?key=%s",
             GEMINI_API_BASE, model, api_key);

    char *payload = json_build_gemini_payload(prompt);
    if (!payload) {
        return SS_ERR_JSON_BUILD;
    }

    LOG_DEBUG("Gemini generate request for model=%s", model);

    SSError err = http_post(url, payload, NULL, 0, response_json_out);
    free(payload);

    if (err != SS_OK) {
        LOG_ERROR("Gemini generate failed: %d", err);
    }

    return err;
}
