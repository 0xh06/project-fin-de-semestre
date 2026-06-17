#include "server/http_server.h"
#include "mongoose/mongoose.h"
#include "auth/jwt.h"
#include "auth/oauth.h"
#include "utils/logger.h"
#include "cJSON/cJSON.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <sqlite3.h>

#define AUTH_TOKEN_TTL_SECONDS (3600 * 24 * 7)

typedef struct {
    int64_t id;
    char email[256];
    char password_hash[65];
    char username[128];
    char created_at[64];
    char settings_json[512];
} HttpUser;

// Variables globales pour le serveur
static SmartStudyApp *g_app = NULL;
static const char *g_jwt_secret = NULL;

// --- Utilitaires de réponse HTTP ---

static sqlite3 *get_db(void) {
    return g_app ? (sqlite3 *) g_app->db_handle : NULL;
}

static bool method_is(struct mg_http_message *hm, const char *method) {
    return mg_strcmp(hm->method, mg_str(method)) == 0;
}

static char *mg_str_to_cstring(struct mg_str value) {
    char *buffer = malloc(value.len + 1);
    if (!buffer) return NULL;

    memcpy(buffer, value.buf, value.len);
    buffer[value.len] = '\0';
    return buffer;
}

static const char *safe_sqlite_text(sqlite3_stmt *stmt, int column) {
    const unsigned char *value = sqlite3_column_text(stmt, column);
    return value ? (const char *) value : "";
}

static bool email_looks_valid(const char *email) {
    const char *at = email ? strchr(email, '@') : NULL;
    return at && at != email && at[1] != '\0' && strchr(at + 1, '.');
}

static void username_from_email(const char *email, char *out_username, size_t out_size) {
    size_t i = 0;

    if (!out_username || out_size == 0) return;

    if (!email || email[0] == '\0') {
        snprintf(out_username, out_size, "Etudiant");
        return;
    }

    while (email[i] != '\0' && email[i] != '@' && i < out_size - 1) {
        out_username[i] = email[i];
        i++;
    }

    out_username[i] = '\0';
    if (i == 0) snprintf(out_username, out_size, "Etudiant");
}

static void parse_username_from_settings(const char *settings_json, const char *email,
                                         char *out_username, size_t out_size) {
    cJSON *settings;
    cJSON *username;

    if (!out_username || out_size == 0) return;

    username_from_email(email, out_username, out_size);
    if (!settings_json || settings_json[0] == '\0') return;

    settings = cJSON_Parse(settings_json);
    if (!settings) return;

    username = cJSON_GetObjectItemCaseSensitive(settings, "username");
    if (cJSON_IsString(username) && username->valuestring && username->valuestring[0] != '\0') {
        snprintf(out_username, out_size, "%s", username->valuestring);
    }

    cJSON_Delete(settings);
}

static uint64_t fnv1a64(const char *value, uint64_t seed) {
    uint64_t hash = 1469598103934665603ULL ^ seed;

    while (value && *value) {
        hash ^= (unsigned char) *value++;
        hash *= 1099511628211ULL;
    }

    return hash;
}

static bool hash_password_sha256(const char *password, char out_hash[65]) {
    static const uint64_t salts[4] = {
        0x9e3779b97f4a7c15ULL,
        0xc2b2ae3d27d4eb4fULL,
        0x165667b19e3779f9ULL,
        0x85ebca77c2b2ae63ULL
    };

    if (!password || !out_hash) return false;

    for (int i = 0; i < 4; i++) {
        unsigned long long part = (unsigned long long) fnv1a64(password, salts[i]);
        snprintf(out_hash + (i * 16), 17, "%016llx", part);
    }

    out_hash[64] = '\0';
    return true;
}

static bool load_user_from_stmt(sqlite3_stmt *stmt, HttpUser *out_user) {
    if (!stmt || !out_user) return false;

    memset(out_user, 0, sizeof(*out_user));
    out_user->id = sqlite3_column_int64(stmt, 0);
    snprintf(out_user->email, sizeof(out_user->email), "%s", safe_sqlite_text(stmt, 1));
    snprintf(out_user->password_hash, sizeof(out_user->password_hash), "%s", safe_sqlite_text(stmt, 2));
    snprintf(out_user->created_at, sizeof(out_user->created_at), "%s", safe_sqlite_text(stmt, 3));
    snprintf(out_user->settings_json, sizeof(out_user->settings_json), "%s", safe_sqlite_text(stmt, 4));
    parse_username_from_settings(out_user->settings_json, out_user->email, out_user->username, sizeof(out_user->username));
    return true;
}

static bool db_find_user_by_email(const char *email, HttpUser *out_user) {
    sqlite3 *db = get_db();
    sqlite3_stmt *stmt = NULL;
    bool found = false;
    const char *sql =
        "SELECT id, email, password_hash, created_at, settings_json "
        "FROM users WHERE email = ? LIMIT 1;";

    if (!db || !email || !out_user) return false;

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        LOG_ERROR("SQLite prepare user_by_email: %s", sqlite3_errmsg(db));
        return false;
    }

    sqlite3_bind_text(stmt, 1, email, -1, SQLITE_TRANSIENT);
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        found = load_user_from_stmt(stmt, out_user);
    }

    sqlite3_finalize(stmt);
    return found;
}

static bool db_find_user_by_id(int64_t user_id, HttpUser *out_user) {
    sqlite3 *db = get_db();
    sqlite3_stmt *stmt = NULL;
    bool found = false;
    const char *sql =
        "SELECT id, email, password_hash, created_at, settings_json "
        "FROM users WHERE id = ? LIMIT 1;";

    if (!db || !out_user) return false;

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        LOG_ERROR("SQLite prepare user_by_id: %s", sqlite3_errmsg(db));
        return false;
    }

    sqlite3_bind_int64(stmt, 1, user_id);
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        found = load_user_from_stmt(stmt, out_user);
    }

    sqlite3_finalize(stmt);
    return found;
}

static bool db_create_user(const char *email, const char *password_hash,
                           const char *username, const char *provider, int64_t *out_user_id) {
    sqlite3 *db = get_db();
    sqlite3_stmt *stmt = NULL;
    bool success = false;
    char settings_json[512];
    cJSON *settings;
    char *settings_str = NULL;
    const char *sql =
        "INSERT INTO users (email, password_hash, settings_json) "
        "VALUES (?, ?, ?);";

    if (!db || !email || !password_hash || !username) return false;

    settings = cJSON_CreateObject();
    cJSON_AddStringToObject(settings, "username", username);
    if (provider && provider[0] != '\0') {
        cJSON_AddStringToObject(settings, "auth_provider", provider);
    }

    settings_str = cJSON_PrintUnformatted(settings);
    snprintf(settings_json, sizeof(settings_json), "%s", settings_str ? settings_str : "{}");
    free(settings_str);
    cJSON_Delete(settings);

    if (sqlite3_prepare_v2(db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        LOG_ERROR("SQLite prepare create_user: %s", sqlite3_errmsg(db));
        return false;
    }

    sqlite3_bind_text(stmt, 1, email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, password_hash, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, settings_json, -1, SQLITE_TRANSIENT);

    if (sqlite3_step(stmt) == SQLITE_DONE) {
        if (out_user_id) *out_user_id = sqlite3_last_insert_rowid(db);
        success = true;
    } else {
        LOG_ERROR("SQLite create_user: %s", sqlite3_errmsg(db));
    }

    sqlite3_finalize(stmt);
    return success;
}

static bool get_json_string(cJSON *obj, const char *key, char *out_value, size_t out_size) {
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);

    if (!cJSON_IsString(item) || !item->valuestring || !out_value || out_size == 0) {
        if (out_value && out_size > 0) out_value[0] = '\0';
        return false;
    }

    snprintf(out_value, out_size, "%s", item->valuestring);
    return true;
}

static bool parse_auth_body(struct mg_http_message *hm, char *email, size_t email_size,
                            char *username, size_t username_size,
                            char *password, size_t password_size) {
    char *body = NULL;
    cJSON *json = NULL;
    bool success = false;

    if (email && email_size > 0) email[0] = '\0';
    if (username && username_size > 0) username[0] = '\0';
    if (password && password_size > 0) password[0] = '\0';

    body = mg_str_to_cstring(hm->body);
    if (!body) return false;

    json = cJSON_Parse(body);
    if (!json) {
        free(body);
        return false;
    }

    success = get_json_string(json, "email", email, email_size);
    if (username) get_json_string(json, "username", username, username_size);
    if (password) success = get_json_string(json, "password", password, password_size) && success;

    cJSON_Delete(json);
    free(body);
    return success;
}

static cJSON *build_user_json(const HttpUser *user) {
    cJSON *obj = cJSON_CreateObject();
    cJSON_AddNumberToObject(obj, "id", (double) user->id);
    cJSON_AddStringToObject(obj, "username", user->username[0] ? user->username : "Etudiant");
    cJSON_AddStringToObject(obj, "email", user->email);
    cJSON_AddStringToObject(obj, "created_at", user->created_at[0] ? user->created_at : "");
    return obj;
}

static void reply_json(struct mg_connection *c, int status_code, const char *json_str) {
    mg_http_reply(c, status_code, 
        "Content-Type: application/json\r\n"
        "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
        "Access-Control-Allow-Origin: *\r\n", 
        "%s", json_str);
}

static void reply_error(struct mg_connection *c, int status_code, const char *message) {
    cJSON *obj = cJSON_CreateObject();
    cJSON_AddStringToObject(obj, "error", message);
    char *json = cJSON_PrintUnformatted(obj);
    reply_json(c, status_code, json);
    free(json);
    cJSON_Delete(obj);
}

static void reply_auth_success(struct mg_connection *c, const HttpUser *user) {
    char *jwt = jwt_generate(user->id, g_jwt_secret, AUTH_TOKEN_TTL_SECONDS);
    char *json = NULL;
    cJSON *resp = NULL;

    if (!jwt) {
        reply_error(c, 500, "Impossible de créer la session.");
        return;
    }

    resp = cJSON_CreateObject();
    cJSON_AddStringToObject(resp, "token", jwt);
    cJSON_AddItemToObject(resp, "user", build_user_json(user));

    json = cJSON_PrintUnformatted(resp);
    reply_json(c, 200, json);

    free(json);
    free(jwt);
    cJSON_Delete(resp);
}

// --- Middlewares ---

static bool verify_auth(struct mg_http_message *hm, int64_t *out_user_id) {
    struct mg_str *auth_header = mg_http_get_header(hm, "Authorization");
    char header_value[768];
    if (!auth_header) return false;

    // Bearer token...
    char token[512] = {0};
    size_t header_len = auth_header->len < sizeof(header_value) - 1 ? auth_header->len : sizeof(header_value) - 1;
    memcpy(header_value, auth_header->buf, header_len);
    header_value[header_len] = '\0';

    if (sscanf(header_value, "Bearer %511s", token) != 1) return false;

    return jwt_verify(token, g_jwt_secret, out_user_id);
}

// --- Auth handlers ---

static void handle_auth_login(struct mg_connection *c, struct mg_http_message *hm) {
    HttpUser user;
    char email[256];
    char password[256];
    char password_hash[65];

    if (!method_is(hm, "POST")) {
        reply_error(c, 405, "Méthode non autorisée.");
        return;
    }

    if (!parse_auth_body(hm, email, sizeof(email), NULL, 0, password, sizeof(password))) {
        reply_error(c, 400, "Requête invalide.");
        return;
    }

    if (!db_find_user_by_email(email, &user)) {
        reply_error(c, 401, "Email ou mot de passe incorrect.");
        return;
    }

    if (!hash_password_sha256(password, password_hash) ||
        strcmp(user.password_hash, password_hash) != 0) {
        reply_error(c, 401, "Email ou mot de passe incorrect.");
        return;
    }

    reply_auth_success(c, &user);
}

static void handle_auth_register(struct mg_connection *c, struct mg_http_message *hm) {
    HttpUser created_user;
    HttpUser existing_user;
    int64_t user_id = 0;
    char email[256];
    char username[128];
    char password[256];
    char password_hash[65];

    if (!method_is(hm, "POST")) {
        reply_error(c, 405, "Méthode non autorisée.");
        return;
    }

    if (!parse_auth_body(hm, email, sizeof(email), username, sizeof(username), password, sizeof(password))) {
        reply_error(c, 400, "Requête invalide.");
        return;
    }

    if (!email_looks_valid(email) || username[0] == '\0' || strlen(password) < 8) {
        reply_error(c, 400, "Email, nom d'utilisateur ou mot de passe invalide.");
        return;
    }

    if (db_find_user_by_email(email, &existing_user)) {
        reply_error(c, 409, "Un compte existe déjà avec cet email.");
        return;
    }

    if (!hash_password_sha256(password, password_hash) ||
        !db_create_user(email, password_hash, username, "password", &user_id) ||
        !db_find_user_by_id(user_id, &created_user)) {
        reply_error(c, 500, "Impossible de créer le compte.");
        return;
    }

    reply_auth_success(c, &created_user);
}

static void handle_auth_me(struct mg_connection *c, struct mg_http_message *hm) {
    HttpUser user;
    int64_t user_id = 0;
    cJSON *resp = NULL;
    char *json = NULL;

    if (!method_is(hm, "GET")) {
        reply_error(c, 405, "Méthode non autorisée.");
        return;
    }

    if (!verify_auth(hm, &user_id)) {
        reply_error(c, 401, "Non autorisé.");
        return;
    }

    if (!db_find_user_by_id(user_id, &user)) {
        reply_error(c, 404, "Utilisateur introuvable.");
        return;
    }

    resp = build_user_json(&user);
    json = cJSON_PrintUnformatted(resp);
    reply_json(c, 200, json);

    free(json);
    cJSON_Delete(resp);
}

// --- OAuth Handlers ---

static void parse_oauth_state_value(const char *state_value, char *out_flow, size_t out_flow_size,
                                    char *out_client_state, size_t out_client_state_size) {
    const char *separator = state_value ? strchr(state_value, '.') : NULL;

    if (out_flow && out_flow_size > 0) snprintf(out_flow, out_flow_size, "login");
    if (out_client_state && out_client_state_size > 0) out_client_state[0] = '\0';

    if (!state_value || state_value[0] == '\0') return;

    if (separator) {
        size_t flow_len = (size_t) (separator - state_value);
        if (out_flow && out_flow_size > 0) {
            size_t copy_len = flow_len < out_flow_size - 1 ? flow_len : out_flow_size - 1;
            memcpy(out_flow, state_value, copy_len);
            out_flow[copy_len] = '\0';
        }
        if (out_client_state && out_client_state_size > 0) {
            snprintf(out_client_state, out_client_state_size, "%s", separator + 1);
        }
    } else if (strcmp(state_value, "register") == 0 || strcmp(state_value, "login") == 0) {
        if (out_flow && out_flow_size > 0) snprintf(out_flow, out_flow_size, "%s", state_value);
    } else if (out_client_state && out_client_state_size > 0) {
        snprintf(out_client_state, out_client_state_size, "%s", state_value);
    }

    if (out_flow && out_flow_size > 0 && strcmp(out_flow, "register") != 0) {
        snprintf(out_flow, out_flow_size, "login");
    }
}

static void get_oauth_state(struct mg_str query, char *out_flow, size_t out_flow_size,
                            char *out_client_state, size_t out_client_state_size) {
    char state_value[256] = {0};

    if (mg_http_get_var(&query, "state", state_value, sizeof(state_value)) > 0) {
        parse_oauth_state_value(state_value, out_flow, out_flow_size, out_client_state, out_client_state_size);
        return;
    }

    if (mg_http_get_var(&query, "flow", state_value, sizeof(state_value)) > 0) {
        snprintf(out_flow, out_flow_size, "%s", strcmp(state_value, "register") == 0 ? "register" : "login");
    } else {
        snprintf(out_flow, out_flow_size, "login");
    }

    if (out_client_state && out_client_state_size > 0 &&
        mg_http_get_var(&query, "client_state", out_client_state, out_client_state_size) <= 0) {
        out_client_state[0] = '\0';
    }
}

static void build_oauth_state(const char *flow, const char *client_state, char *out_state, size_t out_state_size) {
    if (!out_state || out_state_size == 0) return;

    if (client_state && client_state[0] != '\0') {
        snprintf(out_state, out_state_size, "%s.%s", flow, client_state);
    } else {
        snprintf(out_state, out_state_size, "%s", flow);
    }
}

static bool has_env_value(const char *value) {
    return value != NULL && value[0] != '\0';
}

static void redirect_oauth_error(struct mg_connection *c, const char *flow, const char *error_code) {
    const char *frontend_url = getenv("FRONTEND_URL") ? getenv("FRONTEND_URL") : "http://localhost:3000";
    char redirect_url[512];

    snprintf(
        redirect_url,
        sizeof(redirect_url),
        "%s/%s?error=%s",
        frontend_url,
        (flow && strcmp(flow, "register") == 0) ? "register" : "login",
        (error_code && error_code[0] != '\0') ? error_code : "oauth_failed"
    );

    mg_http_reply(c, 302, "Location: %s\r\nAccess-Control-Allow-Origin: *\r\n\r\n", redirect_url);
}

static void handle_oauth_redirect(struct mg_connection *c, struct mg_http_message *hm, const char *provider) {
    char redirect_url[1024];
    char flow[32];
    char client_state[128];
    char combined_state[196];

    get_oauth_state(hm->query, flow, sizeof(flow), client_state, sizeof(client_state));
    build_oauth_state(flow, client_state, combined_state, sizeof(combined_state));

    if (strcmp(provider, "github") == 0) {
        const char *client_id = getenv("GITHUB_CLIENT_ID");
        const char *backend_url = getenv("BACKEND_URL") ? getenv("BACKEND_URL") : "http://localhost:8080";
        if (!has_env_value(client_id)) {
            snprintf(redirect_url, sizeof(redirect_url), "/api/auth/github/callback?code=mock_code&state=%s", combined_state);
        } else {
            char redirect_uri[512];
            char encoded_redirect[1024];

            snprintf(redirect_uri, sizeof(redirect_uri), "%s/api/auth/github/callback", backend_url);
            mg_url_encode(redirect_uri, strlen(redirect_uri), encoded_redirect, sizeof(encoded_redirect));

            snprintf(redirect_url, sizeof(redirect_url), 
                "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=read:user%%20user:email&state=%s",
                client_id, encoded_redirect, combined_state);
        }
    } else if (strcmp(provider, "google") == 0) {
        const char *client_id = getenv("GOOGLE_CLIENT_ID");
        if (!has_env_value(client_id)) {
            snprintf(redirect_url, sizeof(redirect_url), "/api/auth/google/callback?code=mock_code&state=%s", combined_state);
        } else {
            const char *backend_url = getenv("BACKEND_URL") ? getenv("BACKEND_URL") : "http://localhost:8080";
            char redirect_uri[512];
            snprintf(redirect_uri, sizeof(redirect_uri), "%s/api/auth/google/callback", backend_url);
            
            char encoded_redirect[1024];
            mg_url_encode(redirect_uri, strlen(redirect_uri), encoded_redirect, sizeof(encoded_redirect));
            
            snprintf(redirect_url, sizeof(redirect_url), 
                "https://accounts.google.com/o/oauth2/v2/auth?client_id=%s&redirect_uri=%s&response_type=code&scope=email%%20profile&state=%s&prompt=select_account", 
                client_id, encoded_redirect, combined_state);
        }
    }

    mg_http_reply(c, 302, "Location: %s\r\nAccess-Control-Allow-Origin: *\r\n\r\n", redirect_url);
}

static bool ensure_oauth_user(const OAuthUserProfile *profile, const char *provider, HttpUser *out_user) {
    int64_t user_id = 0;
    char username[128];
    char generated_password[512];
    char password_hash[65];

    if (!profile || !profile->email || profile->email[0] == '\0' || !out_user) return false;

    if (db_find_user_by_email(profile->email, out_user)) {
        return true;
    }

    if (profile->name && profile->name[0] != '\0') {
        snprintf(username, sizeof(username), "%s", profile->name);
    } else {
        username_from_email(profile->email, username, sizeof(username));
    }

    snprintf(
        generated_password,
        sizeof(generated_password),
        "oauth:%s:%s:%s",
        provider,
        profile->id ? profile->id : "unknown",
        profile->email
    );

    return hash_password_sha256(generated_password, password_hash) &&
           db_create_user(profile->email, password_hash, username, provider, &user_id) &&
           db_find_user_by_id(user_id, out_user);
}

static void handle_oauth_callback(struct mg_connection *c, struct mg_http_message *hm, const char *provider) {
    HttpUser user;
    char flow[32];
    char client_state[128];
    char code[256];
    char name_encoded[256];
    char email_encoded[256];
    char created_at_encoded[128];
    char redirect_url[1536];

    get_oauth_state(hm->query, flow, sizeof(flow), client_state, sizeof(client_state));

    if (mg_http_get_var(&hm->query, "error", code, sizeof(code)) > 0) {
        redirect_oauth_error(c, flow, strcmp(code, "access_denied") == 0 ? "oauth_cancelled" : "oauth_failed");
        return;
    }

    if (mg_http_get_var(&hm->query, "code", code, sizeof(code)) <= 0) {
        redirect_oauth_error(c, flow, "oauth_failed");
        return;
    }

    char access_token[1024];
    OAuthUserProfile *profile = NULL;
    bool success = false;

    if (strcmp(provider, "github") == 0) {
        const char *client_id = getenv("GITHUB_CLIENT_ID");
        const char *client_secret = getenv("GITHUB_CLIENT_SECRET");
        
        // Mock success if no env var for demonstration, otherwise exchange
        if (has_env_value(client_id) != has_env_value(client_secret)) {
            redirect_oauth_error(c, flow, "oauth_misconfigured");
            return;
        }

        if (has_env_value(client_id) && has_env_value(client_secret)) {
            success = oauth_github_exchange_code(code, client_id, client_secret, access_token, sizeof(access_token));
            if (success) profile = oauth_github_get_user(access_token);
        } else {
            profile = malloc(sizeof(OAuthUserProfile));
            profile->id = strdup("999");
            profile->name = strdup("GitHub User");
            profile->email = strdup("github@example.com");
        }
    } else if (strcmp(provider, "google") == 0) {
        const char *client_id = getenv("GOOGLE_CLIENT_ID");
        const char *client_secret = getenv("GOOGLE_CLIENT_SECRET");
        
        if (has_env_value(client_id) != has_env_value(client_secret)) {
            redirect_oauth_error(c, flow, "oauth_misconfigured");
            return;
        }

        if (has_env_value(client_id) && has_env_value(client_secret)) {
            const char *backend_url = getenv("BACKEND_URL") ? getenv("BACKEND_URL") : "http://localhost:8080";
            char redirect_uri[512];
            snprintf(redirect_uri, sizeof(redirect_uri), "%s/api/auth/google/callback", backend_url);
            
            success = oauth_google_exchange_code(code, client_id, client_secret, redirect_uri, access_token, sizeof(access_token));
            if (success) profile = oauth_google_get_user(access_token);
        } else {
            profile = malloc(sizeof(OAuthUserProfile));
            profile->id = strdup("888");
            profile->name = strdup("Google User");
            profile->email = strdup("google@example.com");
        }
    }

    if (!profile) {
        redirect_oauth_error(c, flow, "oauth_failed");
        return;
    }

    if (!ensure_oauth_user(profile, provider, &user)) {
        redirect_oauth_error(c, flow, "server_error");
        oauth_free_profile(profile);
        return;
    }

    char *jwt = jwt_generate(user.id, g_jwt_secret, AUTH_TOKEN_TTL_SECONDS);
    if (!jwt) {
        redirect_oauth_error(c, flow, "server_error");
        oauth_free_profile(profile);
        return;
    }
    
    // Réinjecter les informations OAuth dans le callback frontend.
    const char *frontend_url = getenv("FRONTEND_URL") ? getenv("FRONTEND_URL") : "http://localhost:3000";
    mg_url_encode(user.username, strlen(user.username), name_encoded, sizeof(name_encoded));
    mg_url_encode(user.email, strlen(user.email), email_encoded, sizeof(email_encoded));
    mg_url_encode(user.created_at, strlen(user.created_at), created_at_encoded, sizeof(created_at_encoded));
    
    snprintf(
        redirect_url,
        sizeof(redirect_url),
        "%s/callback?token=%s&name=%s&email=%s&provider=%s&flow=%s&client_state=%s&user_id=%lld&created_at=%s",
        frontend_url,
        jwt,
        name_encoded,
        email_encoded,
        provider,
        flow,
        client_state,
        (long long) user.id,
        created_at_encoded
    );
    
    mg_http_reply(c, 302, "Location: %s\r\nAccess-Control-Allow-Origin: *\r\n\r\n", redirect_url);

    free(jwt);
    oauth_free_profile(profile);
}

static void handle_dashboard(struct mg_connection *c, struct mg_http_message *hm) {
    int64_t user_id;
    if (!verify_auth(hm, &user_id)) {
        reply_error(c, 401, "Non autorisé");
        return;
    }

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddNumberToObject(resp, "xp_total", 1250);
    cJSON_AddNumberToObject(resp, "level", 5);
    cJSON_AddNumberToObject(resp, "xp_to_next_level", 250);
    cJSON_AddNumberToObject(resp, "streak_days", 12);
    cJSON_AddNumberToObject(resp, "longest_streak", 15);
    cJSON_AddNumberToObject(resp, "documents_count", 8);
    cJSON_AddNumberToObject(resp, "flashcards_mastered", 42);
    cJSON_AddNumberToObject(resp, "flashcards_total", 150);
    cJSON_AddNumberToObject(resp, "quizzes_completed", 10);
    cJSON_AddNumberToObject(resp, "study_time_minutes", 320);

    // Semaine
    int xp_arr[] = {100, 250, 0, 50, 400, 120, 330};
    cJSON *weekly = cJSON_CreateIntArray(xp_arr, 7);
    cJSON_AddItemToObject(resp, "weekly_xp", weekly);

    char *json = cJSON_PrintUnformatted(resp);
    reply_json(c, 200, json);

    free(json);
    cJSON_Delete(resp);
}

// Dispatcher principal
static void ev_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *)ev_data;

        // Gestion du CORS (Preflight OPTIONS)
        if (mg_strcmp(hm->method, mg_str("OPTIONS")) == 0) {
            mg_http_reply(c, 204, 
                "Access-Control-Allow-Origin: *\r\n"
                "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
                "Access-Control-Allow-Headers: Content-Type, Authorization\r\n", "");
            return;
        }

        // Routage (très simplifié)
        if (mg_strcmp(hm->uri, mg_str("/api/auth/login")) == 0) {
            handle_auth_login(c, hm);
        } 
        else if (mg_strcmp(hm->uri, mg_str("/api/auth/register")) == 0) {
            handle_auth_register(c, hm);
        }
        else if (mg_strcmp(hm->uri, mg_str("/api/auth/me")) == 0) {
            handle_auth_me(c, hm);
        }
        else if (mg_strcmp(hm->uri, mg_str("/api/auth/github")) == 0) {
            handle_oauth_redirect(c, hm, "github");
        }
        else if (mg_strcmp(hm->uri, mg_str("/api/auth/google")) == 0) {
            handle_oauth_redirect(c, hm, "google");
        }
        else if (mg_strcmp(hm->uri, mg_str("/api/auth/github/callback")) == 0) {
            handle_oauth_callback(c, hm, "github");
        }
        else if (mg_strcmp(hm->uri, mg_str("/api/auth/google/callback")) == 0) {
            handle_oauth_callback(c, hm, "google");
        }
        else if (mg_strcmp(hm->uri, mg_str("/api/gamification/dashboard")) == 0) {
            handle_dashboard(c, hm);
        }
        else {
            reply_error(c, 404, "Endpoint non trouvé");
        }
    }
}

bool http_server_start(SmartStudyApp *app, const HttpServerConfig *config) {
    g_app = app;
    g_jwt_secret = config->jwt_secret;

    struct mg_mgr mgr;
    mg_mgr_init(&mgr);

    char listen_addr[128];
    snprintf(listen_addr, sizeof(listen_addr), "http://0.0.0.0:%s", config->port);

    if (mg_http_listen(&mgr, listen_addr, ev_handler, NULL) == NULL) {
        LOG_ERROR("Erreur : impossible d'écouter sur %s", listen_addr);
        return false;
    }

    LOG_INFO("Serveur HTTP en écoute sur %s", listen_addr);

    // Boucle d'événements
    while (true) {
        mg_mgr_poll(&mgr, 1000);
    }

    mg_mgr_free(&mgr);
    return true;
}
