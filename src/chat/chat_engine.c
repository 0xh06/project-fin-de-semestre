/**
 * @file chat_engine.c
 * @brief Implémentation du moteur de conversation IA contextuel.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "chat/chat_engine.h"
#include "api/ai_client.h"
#include "db/db.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

#define MAX_HISTORY_TOKENS 4000
#define CHARS_PER_TOKEN 4
#define MAX_HISTORY_MESSAGES 10
#define SUGGESTION_COUNT 3

/**
 * Estime le nombre de tokens dans une chaîne.
 */
static int estimate_tokens(const char *text) {
    if (!text) return 0;
    return strlen(text) / CHARS_PER_TOKEN;
}

/**
 * Charge les résumés des documents pour le contexte.
 */
static SSError load_document_context(int *document_ids, int doc_count, char **context_out) {
    if (!document_ids || doc_count == 0) {
        *context_out = strdup("");
        return *context_out ? SS_OK : SS_ERR_ALLOC;
    }

    // Note: nécessite fonction db_document_get_summary dans db.h
    // Pour l'instant, on construit un contexte placeholder
    char *context = malloc(4096);
    if (!context) return SS_ERR_ALLOC;
    
    strcpy(context, "Documents disponibles:\n");
    
    for (int i = 0; i < doc_count; i++) {
        char line[256];
        snprintf(line, sizeof(line), "- Document ID %d\n", document_ids[i]);
        strcat(context, line);
    }
    
    *context_out = context;
    return SS_OK;
}

/**
 * Charge l'historique de conversation récent.
 */
static SSError load_conversation_history(int64_t user_id, char **history_out, int *tokens_out) {
    // Note: nécessite fonction db_chat_get_recent_messages dans db.h
    // Pour l'instant, on retourne un historique vide
    *history_out = strdup("");
    *tokens_out = 0;
    return SS_OK;
}

/**
 * Construit le prompt système avec contexte documentaire.
 */
static SSError build_system_prompt(const char *document_context, const char *history, 
                                   char **prompt_out) {
    size_t prompt_size = strlen(document_context) + strlen(history) + 1024;
    char *prompt = malloc(prompt_size);
    if (!prompt) return SS_ERR_ALLOC;
    
    snprintf(prompt, prompt_size,
        "Tu es SmartStudy AI, un tuteur expert. "
        "Aide l'étudiant à comprendre ses cours et documents.\n\n"
        "Contexte documentaire:\n%s\n\n"
        "Historique récent:\n%s\n\n"
        "Réponds de manière précise et pédagogique.",
        document_context, history);
    
    *prompt_out = prompt;
    return SS_OK;
}

SSError chat_send(int64_t user_id, const char *user_message, 
                  int *document_ids, int doc_count, ChatResponse *out) {
    if (!user_message || !out) {
        return SS_ERR_NULL_PTR;
    }

    memset(out, 0, sizeof(ChatResponse));

    LOG_INFO("Chat send: user=%lld, docs=%d", user_id, doc_count);

    // 1. Charger le contexte des documents
    char *document_context = NULL;
    SSError err = load_document_context(document_ids, doc_count, &document_context);
    if (err != SS_OK) {
        return err;
    }

    // 2. Charger l'historique de conversation (limité en tokens)
    char *history = NULL;
    int history_tokens = 0;
    err = load_conversation_history(user_id, &history, &history_tokens);
    if (err != SS_OK) {
        free(document_context);
        return err;
    }

    // 3. Construire le prompt système
    char *system_prompt = NULL;
    err = build_system_prompt(document_context, history, &system_prompt);
    free(document_context);
    free(history);
    
    if (err != SS_OK) {
        return err;
    }

    // 4. Construire le prompt complet
    char full_prompt[16384];
    snprintf(full_prompt, sizeof(full_prompt),
        "%s\n\nQuestion de l'étudiant:\n%s",
        system_prompt, user_message);

    free(system_prompt);

    // 5. Envoyer à l'API IA
    char *response_json = NULL;
    err = gemini_generate(full_prompt, &response_json);
    
    if (err != SS_OK) {
        LOG_ERROR("Erreur génération IA: %d", err);
        return err;
    }

    // 6. Parser la réponse
    cJSON *root = json_parse(response_json);
    free(response_json);
    
    if (!root) {
        return SS_ERR_JSON_PARSE;
    }

    const char *text_content = json_get_string(root, "text");
    if (!text_content) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    out->content = strdup(text_content);
    out->tokens_used = estimate_tokens(text_content);
    out->total_tokens = estimate_tokens(full_prompt) + out->tokens_used;
    
    const char *model = getenv("GEMINI_MODEL");
    out->model_used = strdup(model ? model : "gemini-2.0-flash");

    cJSON_Delete(root);

    // 7. Sauvegarder les messages en SQLite
    DBChatMessage user_msg;
    memset(&user_msg, 0, sizeof(user_msg));
    user_msg.user_id = user_id;
    user_msg.role = "user";
    user_msg.content = strdup(user_message);
    user_msg.tokens = estimate_tokens(user_message);
    
    int64_t msg_id;
    DBError db_err = chat_message_save(&user_msg, &msg_id);
    free(user_msg.content);
    
    if (db_err != DB_OK) {
        LOG_WARN("Erreur sauvegarde message utilisateur");
    }

    DBChatMessage ai_msg;
    memset(&ai_msg, 0, sizeof(ai_msg));
    ai_msg.user_id = user_id;
    ai_msg.role = "assistant";
    ai_msg.content = strdup(out->content);
    ai_msg.tokens = out->tokens_used;
    ai_msg.model_used = out->model_used;
    
    db_err = chat_message_save(&ai_msg, &msg_id);
    free(ai_msg.content);
    
    if (db_err != DB_OK) {
        LOG_WARN("Erreur sauvegarde message IA");
    }

    LOG_INFO("Chat response: tokens=%d, total=%d", out->tokens_used, out->total_tokens);

    return SS_OK;
}

SSError chat_get_history(int64_t user_id, int limit, DBChatMessage **out, int *count) {
    if (!out || !count) {
        return SS_ERR_NULL_PTR;
    }

    // Note: nécessite fonction db_chat_get_history dans db.h
    // Pour l'instant, on utilise une approche simplifiée
    *out = NULL;
    *count = 0;
    
    LOG_INFO("Récupération historique: user=%lld, limit=%d", user_id, limit);
    
    return SS_OK;
}

SSError chat_clear_history(int64_t user_id) {
    // Note: nécessite fonction db_chat_clear_history dans db.h
    LOG_INFO("Effacement historique: user=%lld", user_id);
    
    return SS_OK;
}

SSError chat_suggest_followup(const char *last_message, const char *ai_response, 
                             char ***suggestions_out) {
    if (!last_message || !ai_response || !suggestions_out) {
        return SS_ERR_NULL_PTR;
    }

    char prompt[8192];
    snprintf(prompt, sizeof(prompt),
        "Génère %d questions de suivi pertinentes basées sur cette conversation. "
        "Format JSON: [\"question1\", \"question2\", \"question3\"]\n\n"
        "Dernier message: %s\n"
        "Réponse IA: %s",
        SUGGESTION_COUNT, last_message, ai_response);

    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        return err;
    }

    cJSON *root = json_parse(response_json);
    free(response_json);

    if (!root) {
        return SS_ERR_JSON_PARSE;
    }

    const char *text_content = json_get_string(root, "text");
    if (!text_content) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *suggestions_array = cJSON_Parse(text_content);
    cJSON_Delete(root);

    if (!suggestions_array || !cJSON_IsArray(suggestions_array)) {
        return SS_ERR_JSON_PARSE;
    }

    int array_size = cJSON_GetArraySize(suggestions_array);
    int actual_count = array_size > SUGGESTION_COUNT ? SUGGESTION_COUNT : array_size;

    char **suggestions = calloc(actual_count + 1, sizeof(char*));
    if (!suggestions) {
        cJSON_Delete(suggestions_array);
        return SS_ERR_ALLOC;
    }

    for (int i = 0; i < actual_count; i++) {
        const char *suggestion = cJSON_GetArrayItem(suggestions_array, i)->valuestring;
        if (suggestion) {
            suggestions[i] = strdup(suggestion);
        }
    }
    suggestions[actual_count] = NULL;

    cJSON_Delete(suggestions_array);

    *suggestions_out = suggestions;
    LOG_INFO("%d suggestions générées", actual_count);

    return SS_OK;
}

void chat_response_free(ChatResponse *response) {
    if (!response) return;
    
    free(response->content);
    free(response->model_used);
    
    response->content = NULL;
    response->model_used = NULL;
}

void chat_suggestions_free(char **suggestions) {
    if (!suggestions) return;
    
    for (int i = 0; suggestions[i]; i++) {
        free(suggestions[i]);
    }
    free(suggestions);
}
