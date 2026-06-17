#include "server/http_server.h"
#include "mongoose/mongoose.h"
#include "auth/jwt.h"
#include "auth/oauth.h"
#include "utils/logger.h"
#include "cJSON/cJSON.h"
#include <stdlib.h>

// Variables globales pour le serveur
static SmartStudyApp *g_app = NULL;
static const char *g_jwt_secret = NULL;

// --- Utilitaires de réponse HTTP ---

static void reply_json(struct mg_connection *c, int status_code, const char *json_str) {
    mg_http_reply(c, status_code, 
        "Content-Type: application/json\r\n"
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

// --- Middlewares ---

static bool verify_auth(struct mg_http_message *hm, int64_t *out_user_id) {
    struct mg_str *auth_header = mg_http_get_header(hm, "Authorization");
    if (!auth_header) return false;

    // Bearer token...
    char token[512] = {0};
    if (sscanf(auth_header->ptr, "Bearer %511s", token) != 1) return false;

    return jwt_verify(token, g_jwt_secret, out_user_id);
}

// --- Handlers (Stubs simplifiés pour intégration rapide) ---

static void handle_auth_login(struct mg_connection *c, struct mg_http_message *hm) {
    // Parsez le body hm->body
    // Validation basique et génération JWT
    // En prod : vérifier dans SQLite
    char *jwt = jwt_generate(1, g_jwt_secret, 3600 * 24 * 7); // 7 jours pour l'user ID = 1

    cJSON *resp = cJSON_CreateObject();
    cJSON_AddStringToObject(resp, "token", jwt);
    cJSON *user = cJSON_CreateObject();
    cJSON_AddNumberToObject(user, "id", 1);
    cJSON_AddStringToObject(user, "username", "Etudiant");
    cJSON_AddStringToObject(user, "email", "test@test.com");
    cJSON_AddItemToObject(resp, "user", user);

    char *json = cJSON_PrintUnformatted(resp);
    reply_json(c, 200, json);

    free(json);
    free(jwt);
    cJSON_Delete(resp);
}

// --- OAuth Handlers ---

static void handle_oauth_callback(struct mg_connection *c, struct mg_http_message *hm, const char *provider) {
    char code[256];
    if (mg_http_get_var(&hm->query, "code", code, sizeof(code)) <= 0) {
        reply_error(c, 400, "Code OAuth manquant");
        return;
    }

    char access_token[1024];
    OAuthUserProfile *profile = NULL;
    bool success = false;

    if (strcmp(provider, "github") == 0) {
        const char *client_id = getenv("GITHUB_CLIENT_ID") ? getenv("GITHUB_CLIENT_ID") : "mock_id";
        const char *client_secret = getenv("GITHUB_CLIENT_SECRET") ? getenv("GITHUB_CLIENT_SECRET") : "mock_secret";
        
        // Mock success if no env var for demonstration, otherwise exchange
        if (getenv("GITHUB_CLIENT_ID")) {
            success = oauth_github_exchange_code(code, client_id, client_secret, access_token, sizeof(access_token));
            if (success) profile = oauth_github_get_user(access_token);
        } else {
            profile = malloc(sizeof(OAuthUserProfile));
            profile->id = strdup("999");
            profile->name = strdup("GitHub User");
            profile->email = strdup("github@example.com");
        }
    } else if (strcmp(provider, "google") == 0) {
        const char *client_id = getenv("GOOGLE_CLIENT_ID") ? getenv("GOOGLE_CLIENT_ID") : "mock_id";
        const char *client_secret = getenv("GOOGLE_CLIENT_SECRET") ? getenv("GOOGLE_CLIENT_SECRET") : "mock_secret";
        
        if (getenv("GOOGLE_CLIENT_ID")) {
            success = oauth_google_exchange_code(code, client_id, client_secret, "http://localhost:8080/api/auth/google/callback", access_token, sizeof(access_token));
            if (success) profile = oauth_google_get_user(access_token);
        } else {
            profile = malloc(sizeof(OAuthUserProfile));
            profile->id = strdup("888");
            profile->name = strdup("Google User");
            profile->email = strdup("google@example.com");
        }
    }

    if (!profile) {
        reply_error(c, 500, "Erreur lors de la récupération du profil OAuth");
        return;
    }

    // Générer JWT (En production, vérifier/créer l'utilisateur dans SQLite)
    char *jwt = jwt_generate(atoi(profile->id), g_jwt_secret, 3600 * 24 * 7);
    
    // Créer l'objet utilisateur encodé en base64/url pour le frontend (simplifié ici avec juste le token)
    // Redirection vers le frontend
    char redirect_url[512];
    snprintf(redirect_url, sizeof(redirect_url), "http://localhost:3000/callback?token=%s&name=%s", jwt, profile->name ? profile->name : "User");
    
    mg_http_reply(c, 302, "Location: %s\r\n\r\n", redirect_url);

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
        if (mg_vprintf(hm->method.ptr, hm->method.len, "OPTIONS") == 0) {
            mg_http_reply(c, 204, 
                "Access-Control-Allow-Origin: *\r\n"
                "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
                "Access-Control-Allow-Headers: Content-Type, Authorization\r\n", "");
            return;
        }

        // Routage (très simplifié)
        if (mg_http_match_uri(hm, "/api/auth/login")) {
            handle_auth_login(c, hm);
        } 
        else if (mg_http_match_uri(hm, "/api/auth/github/callback")) {
            handle_oauth_callback(c, hm, "github");
        }
        else if (mg_http_match_uri(hm, "/api/auth/google/callback")) {
            handle_oauth_callback(c, hm, "google");
        }
        else if (mg_http_match_uri(hm, "/api/gamification/dashboard")) {
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
