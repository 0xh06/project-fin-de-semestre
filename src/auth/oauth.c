#include "auth/oauth.h"
#include "cJSON/cJSON.h"
#include "utils/logger.h"
#include <curl/curl.h>
#include <stdlib.h>
#include <string.h>

struct MemoryStruct {
    char *memory;
    size_t size;
};

static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *)userp;

    char *ptr = realloc(mem->memory, mem->size + realsize + 1);
    if (!ptr) {
        LOG_ERROR("Erreur: pas assez de mémoire (realloc a retourné NULL)");
        return 0;
    }

    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;

    return realsize;
}

void oauth_free_profile(OAuthUserProfile *profile) {
    if (!profile) return;
    if (profile->id) free(profile->id);
    if (profile->email) free(profile->email);
    if (profile->name) free(profile->name);
    free(profile);
}

// -----------------------------------------------------------------------------
// GITHUB
// -----------------------------------------------------------------------------

bool oauth_github_exchange_code(const char *code, const char *client_id, const char *client_secret, char *out_access_token, size_t max_len) {
    CURL *curl;
    CURLcode res;
    struct MemoryStruct chunk;
    chunk.memory = malloc(1);
    chunk.size = 0;
    bool success = false;

    curl = curl_easy_init();
    if (curl) {
        char post_data[1024];
        snprintf(post_data, sizeof(post_data), "client_id=%s&client_secret=%s&code=%s", client_id, client_secret, code);

        curl_easy_setopt(curl, CURLOPT_URL, "https://github.com/login/oauth/access_token");
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, post_data);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);

        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Accept: application/json");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        res = curl_easy_perform(curl);
        if (res == CURLE_OK) {
            cJSON *json = cJSON_Parse(chunk.memory);
            if (json) {
                cJSON *token = cJSON_GetObjectItem(json, "access_token");
                if (cJSON_IsString(token) && (token->valuestring != NULL)) {
                    strncpy(out_access_token, token->valuestring, max_len - 1);
                    out_access_token[max_len - 1] = '\0';
                    success = true;
                } else {
                    LOG_ERROR("GitHub OAuth Error: %s", chunk.memory);
                }
                cJSON_Delete(json);
            }
        } else {
            LOG_ERROR("Erreur curl GitHub exchange: %s", curl_easy_strerror(res));
        }

        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    free(chunk.memory);
    return success;
}

OAuthUserProfile* oauth_github_get_user(const char *access_token) {
    CURL *curl;
    CURLcode res;
    struct MemoryStruct chunk;
    chunk.memory = malloc(1);
    chunk.size = 0;
    OAuthUserProfile *profile = NULL;

    curl = curl_easy_init();
    if (curl) {
        curl_easy_setopt(curl, CURLOPT_URL, "https://api.github.com/user");
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);
        curl_easy_setopt(curl, CURLOPT_USERAGENT, "SmartStudy-AI-Backend");

        char auth_header[256];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", access_token);
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, auth_header);
        headers = curl_slist_append(headers, "Accept: application/json");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        res = curl_easy_perform(curl);
        if (res == CURLE_OK) {
            cJSON *json = cJSON_Parse(chunk.memory);
            if (json) {
                profile = malloc(sizeof(OAuthUserProfile));
                memset(profile, 0, sizeof(OAuthUserProfile));

                cJSON *id = cJSON_GetObjectItem(json, "id");
                cJSON *email = cJSON_GetObjectItem(json, "email");
                cJSON *name = cJSON_GetObjectItem(json, "name");
                cJSON *login = cJSON_GetObjectItem(json, "login");

                if (cJSON_IsNumber(id)) {
                    char id_str[32];
                    snprintf(id_str, sizeof(id_str), "%d", id->valueint);
                    profile->id = strdup(id_str);
                }

                if (cJSON_IsString(email) && email->valuestring) {
                    profile->email = strdup(email->valuestring);
                } else if (cJSON_IsString(login) && login->valuestring) {
                    // Fallback email si github ne donne pas l'email public
                    char fake_email[128];
                    snprintf(fake_email, sizeof(fake_email), "%s@users.noreply.github.com", login->valuestring);
                    profile->email = strdup(fake_email);
                }

                if (cJSON_IsString(name) && name->valuestring) {
                    profile->name = strdup(name->valuestring);
                } else if (cJSON_IsString(login) && login->valuestring) {
                    profile->name = strdup(login->valuestring);
                }

                cJSON_Delete(json);
            }
        }
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    free(chunk.memory);
    return profile;
}

// -----------------------------------------------------------------------------
// GOOGLE
// -----------------------------------------------------------------------------

bool oauth_google_exchange_code(const char *code, const char *client_id, const char *client_secret, const char *redirect_uri, char *out_access_token, size_t max_len) {
    CURL *curl;
    CURLcode res;
    struct MemoryStruct chunk;
    chunk.memory = malloc(1);
    chunk.size = 0;
    bool success = false;

    curl = curl_easy_init();
    if (curl) {
        char post_data[2048];
        snprintf(post_data, sizeof(post_data), "client_id=%s&client_secret=%s&code=%s&grant_type=authorization_code&redirect_uri=%s", client_id, client_secret, code, redirect_uri);

        curl_easy_setopt(curl, CURLOPT_URL, "https://oauth2.googleapis.com/token");
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, post_data);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);

        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/x-www-form-urlencoded");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        res = curl_easy_perform(curl);
        if (res == CURLE_OK) {
            cJSON *json = cJSON_Parse(chunk.memory);
            if (json) {
                cJSON *token = cJSON_GetObjectItem(json, "access_token");
                if (cJSON_IsString(token) && (token->valuestring != NULL)) {
                    strncpy(out_access_token, token->valuestring, max_len - 1);
                    out_access_token[max_len - 1] = '\0';
                    success = true;
                } else {
                    LOG_ERROR("Google OAuth Error: %s", chunk.memory);
                }
                cJSON_Delete(json);
            }
        }
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    free(chunk.memory);
    return success;
}

OAuthUserProfile* oauth_google_get_user(const char *access_token) {
    CURL *curl;
    CURLcode res;
    struct MemoryStruct chunk;
    chunk.memory = malloc(1);
    chunk.size = 0;
    OAuthUserProfile *profile = NULL;

    curl = curl_easy_init();
    if (curl) {
        curl_easy_setopt(curl, CURLOPT_URL, "https://www.googleapis.com/oauth2/v2/userinfo");
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);

        char auth_header[256];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", access_token);
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, auth_header);
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        res = curl_easy_perform(curl);
        if (res == CURLE_OK) {
            cJSON *json = cJSON_Parse(chunk.memory);
            if (json) {
                profile = malloc(sizeof(OAuthUserProfile));
                memset(profile, 0, sizeof(OAuthUserProfile));

                cJSON *id = cJSON_GetObjectItem(json, "id");
                cJSON *email = cJSON_GetObjectItem(json, "email");
                cJSON *name = cJSON_GetObjectItem(json, "name");

                if (cJSON_IsString(id) && id->valuestring) {
                    profile->id = strdup(id->valuestring);
                }
                if (cJSON_IsString(email) && email->valuestring) {
                    profile->email = strdup(email->valuestring);
                }
                if (cJSON_IsString(name) && name->valuestring) {
                    profile->name = strdup(name->valuestring);
                }

                cJSON_Delete(json);
            }
        }
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
    }
    free(chunk.memory);
    return profile;
}
