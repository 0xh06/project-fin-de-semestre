/**
 * @file rest_client.c
 * @brief Implémentation du client HTTP générique via libcurl.
 */

#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>
#include "api/rest_client.h"
#include "utils/logger.h"

/** Callback libcurl pour accumuler les données de réponse */
static size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t total = size * nmemb;
    HttpBuffer *buf = (HttpBuffer *)userp;

    /* Agrandir le buffer si nécessaire */
    if (buf->size + total + 1 > buf->capacity) {
        size_t new_cap = (buf->capacity == 0) ? 4096 : buf->capacity * 2;
        while (new_cap < buf->size + total + 1) new_cap *= 2;

        char *new_data = realloc(buf->data, new_cap);
        if (!new_data) return 0; /* Signale une erreur à curl */
        buf->data = new_data;
        buf->capacity = new_cap;
    }

    memcpy(buf->data + buf->size, contents, total);
    buf->size += total;
    buf->data[buf->size] = '\0';

    return total;
}

SSError http_init(void) {
    CURLcode res = curl_global_init(CURL_GLOBAL_ALL);
    if (res != CURLE_OK) {
        LOG_ERROR("curl_global_init failed: %s", curl_easy_strerror(res));
        return SS_ERR_HTTP_REQUEST;
    }
    return SS_OK;
}

void http_cleanup(void) {
    curl_global_cleanup();
}

SSError http_post_json(const char *url,
                       const char *json_body,
                       const char *auth_token,
                       HttpResponse *response) {
    if (!url || !json_body || !response) return SS_ERR_NULL_PTR;

    memset(response, 0, sizeof(HttpResponse));

    CURL *curl = curl_easy_init();
    if (!curl) return SS_ERR_HTTP_REQUEST;

    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    /* Ajouter le header Authorization si un token est fourni */
    if (auth_token) {
        char auth_header[1024];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", auth_token);
        headers = curl_slist_append(headers, auth_header);
    }

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_body);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response->body);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);

    CURLcode res = curl_easy_perform(curl);

    if (res != CURLE_OK) {
        LOG_ERROR("HTTP POST failed: %s", curl_easy_strerror(res));
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        return SS_ERR_HTTP_REQUEST;
    }

    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
    response->status_code = (int)http_code;

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (http_code == 401 || http_code == 403) return SS_ERR_API_AUTH;
    if (http_code == 429)                      return SS_ERR_API_LIMIT;
    if (http_code < 200 || http_code >= 300)   return SS_ERR_HTTP_RESPONSE;

    return SS_OK;
}

SSError http_get(const char *url,
                 const char *auth_token,
                 HttpResponse *response) {
    if (!url || !response) return SS_ERR_NULL_PTR;

    memset(response, 0, sizeof(HttpResponse));

    CURL *curl = curl_easy_init();
    if (!curl) return SS_ERR_HTTP_REQUEST;

    struct curl_slist *headers = NULL;
    if (auth_token) {
        char auth_header[1024];
        snprintf(auth_header, sizeof(auth_header), "Authorization: Bearer %s", auth_token);
        headers = curl_slist_append(headers, auth_header);
    }

    curl_easy_setopt(curl, CURLOPT_URL, url);
    if (headers) curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response->body);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);

    CURLcode res = curl_easy_perform(curl);

    if (res != CURLE_OK) {
        LOG_ERROR("HTTP GET failed: %s", curl_easy_strerror(res));
        if (headers) curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        return SS_ERR_HTTP_REQUEST;
    }

    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);
    response->status_code = (int)http_code;

    if (headers) curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    return SS_OK;
}

void http_response_free(HttpResponse *response) {
    if (response && response->body.data) {
        free(response->body.data);
        response->body.data = NULL;
        response->body.size = 0;
        response->body.capacity = 0;
    }
}
