/**
 * @file db_supabase.c
 * @brief Implémentation Supabase (API REST via PostgREST) de la couche DB.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "db/db_interface.h"
#include "api/rest_client.h"
#include <cJSON.h>
#include "utils/logger.h"

/* Contexte Supabase */
static char g_supabase_url[256] = {0};
static char g_supabase_key[512] = {0};
static char g_auth_header[550] = {0};
static char g_apikey_header[550] = {0};

/* =========================================================================
 * Helpers internes Supabase
 * ========================================================================= */

static DBError supabase_init(const char *config_str) {
    (void)config_str;
    
    const char *env_url = getenv("SUPABASE_URL");
    const char *env_key = getenv("SUPABASE_KEY");
    
    if (!env_url || !env_key) {
        LOG_ERROR("SUPABASE_URL ou SUPABASE_KEY manquante");
        return DB_ERR_INVALID_PARAM;
    }

    snprintf(g_supabase_url, sizeof(g_supabase_url), "%s", env_url);
    snprintf(g_supabase_key, sizeof(g_supabase_key), "%s", env_key);
    snprintf(g_auth_header, sizeof(g_auth_header), "Authorization: Bearer %s", env_key);
    snprintf(g_apikey_header, sizeof(g_apikey_header), "apikey: %s", env_key);

    return DB_OK;
}

static void supabase_close(void) {
    /* Rien à libérer localement */
}

/* Supabase REST API n'a pas de transactions "client side" par défaut sans utiliser les RPC. On stub. */
static DBError supabase_begin(void) { return DB_OK; }
static DBError supabase_commit(void) { return DB_OK; }
static DBError supabase_rollback(void) { return DB_OK; }

/* =========================================================================
 * CRUD - Users
 * ========================================================================= */

static DBError supabase_user_create(const char *email, const char *password_hash, const char *settings_json, int64_t *out_id) {
    char url[512];
    snprintf(url, sizeof(url), "%s/rest/v1/users", g_supabase_url);

    cJSON *req = cJSON_CreateObject();
    cJSON_AddStringToObject(req, "email", email);
    cJSON_AddStringToObject(req, "password_hash", password_hash);
    cJSON_AddStringToObject(req, "settings_json", settings_json ? settings_json : "{}");
    
    char *json_body = cJSON_PrintUnformatted(req);
    cJSON_Delete(req);

    /* Prefer: return=representation -> pour avoir le payload inséré (et donc l'ID) */
    const char *headers[] = {
        g_apikey_header,
        g_auth_header,
        "Prefer: return=representation"
    };

    HttpResponse resp;
    SSError err = http_post_json(url, json_body, headers, 3, &resp);
    free(json_body);

    if (err != SS_OK || resp.status_code >= 300) {
        LOG_ERROR("Erreur Supabase user_create: %d", resp.status_code);
        http_response_free(&resp);
        return DB_ERR_SQLITE; /* Generic error */
    }

    if (out_id && resp.body.data) {
        /* Parse la reponse tableau pour trouver l'ID */
        cJSON *res_array = cJSON_Parse(resp.body.data);
        if (res_array && cJSON_IsArray(res_array) && cJSON_GetArraySize(res_array) > 0) {
            cJSON *first = cJSON_GetArrayItem(res_array, 0);
            cJSON *id_val = cJSON_GetObjectItem(first, "id");
            if (id_val) *out_id = id_val->valuedouble;
        }
        cJSON_Delete(res_array);
    }

    http_response_free(&resp);
    return DB_OK;
}

static DBError supabase_user_find_by_email(const char *email, DBUser *out_user) {
    /* STUB */
    return DB_ERR_NOT_FOUND;
}

static void supabase_user_free(DBUser *user) {
    if (!user) return;
    free(user->email);
    free(user->password_hash);
    free(user->created_at);
    free(user->settings_json);
    memset(user, 0, sizeof(DBUser));
}

/* =========================================================================
 * Interface publique Supabase
 * ========================================================================= */

DBInterface supabase_interface = {
    .init = supabase_init,
    .close = supabase_close,
    .begin = supabase_begin,
    .commit = supabase_commit,
    .rollback = supabase_rollback,
    .user_create = supabase_user_create,
    .user_find_by_email = supabase_user_find_by_email,
    .document_save = NULL, /* STUB */
    .document_get_all_by_user = NULL, /* STUB */
    .flashcard_save = NULL, /* STUB */
    .flashcard_update_review = NULL, /* STUB */
    .flashcard_list_due_today = NULL, /* STUB */
    .chat_message_save = NULL, /* STUB */
    .user_free = supabase_user_free,
    .document_list_free = NULL, /* STUB */
    .flashcard_list_free = NULL /* STUB */
};
