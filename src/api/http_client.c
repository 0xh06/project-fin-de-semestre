/**
 * @file http_client.c
 * @brief Implémentation du client HTTP robuste avec retries et backoff exponentiel.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>
#include "api/http_client.h"
#include "utils/logger.h"

#ifdef _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

#define HTTP_MAX_RETRIES 3
#define HTTP_DEFAULT_TIMEOUT_SEC 30L
#define HTTP_BACKOFF_INITIAL_MS 1000L

typedef enum {
    HTTP_METHOD_GET = 0,
    HTTP_METHOD_POST = 1,
} HttpMethod;

typedef struct {
    char *data;
    size_t size;
    size_t capacity;
} HttpBuffer;

static long g_timeout_sec = HTTP_DEFAULT_TIMEOUT_SEC;
static int g_curl_initialized = 0;

static void sleep_ms(long ms) {
    if (ms <= 0) {
        return;
    }

#ifdef _WIN32
    Sleep((DWORD)ms);
#else
    usleep((unsigned int)(ms * 1000));
#endif
}

static size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t total = size * nmemb;
    HttpBuffer *buf = (HttpBuffer *)userp;

    if (!buf || !contents) return 0;

    if (buf->size + total + 1 > buf->capacity) {
        size_t new_cap = (buf->capacity == 0) ? 4096 : buf->capacity * 2;
        while (new_cap < buf->size + total + 1) {
            new_cap *= 2;
        }

        char *new_data = realloc(buf->data, new_cap);
        if (!new_data) return 0;
        buf->data = new_data;
        buf->capacity = new_cap;
    }

    memcpy(buf->data + buf->size, contents, total);
    buf->size += total;
    buf->data[buf->size] = '\0';

    return total;
}

static char *dup_empty_string(void) {
    char *empty = (char *)malloc(1);
    if (empty) {
        empty[0] = '\0';
    }
    return empty;
}

static void redact_url_for_log(const char *url, char *buffer, size_t buffer_size) {
    if (!buffer || buffer_size == 0) return;

    if (!url) {
        snprintf(buffer, buffer_size, "(null)");
        return;
    }

    const char *query = strchr(url, '?');
    if (!query) {
        snprintf(buffer, buffer_size, "%s", url);
        return;
    }

    size_t prefix_len = (size_t)(query - url);
    if (prefix_len >= buffer_size) {
        prefix_len = buffer_size - 1;
    }

    snprintf(buffer, buffer_size, "%.*s?[redacted]", (int)prefix_len, url);
}

static void http_buffer_reset(HttpBuffer *buf) {
    if (!buf) return;
    free(buf->data);
    buf->data = NULL;
    buf->size = 0;
    buf->capacity = 0;
}

static void http_buffer_finalize(HttpBuffer *buf) {
    if (!buf) return;
    if (!buf->data) {
        buf->data = dup_empty_string();
        if (buf->data) {
            buf->size = 0;
            buf->capacity = 1;
        }
    }
}

static void log_request(HttpMethod method, const char *url, const char *json_body) {
    char redacted_url[768];
    redact_url_for_log(url, redacted_url, sizeof(redacted_url));
    LOG_DEBUG("HTTP %s %s", method == HTTP_METHOD_POST ? "POST" : "GET", redacted_url);
    if (method == HTTP_METHOD_POST && json_body) {
        LOG_DEBUG("HTTP request body: %s", json_body);
    }
}

static void log_response(long http_code, const char *body) {
    LOG_DEBUG("HTTP response code: %ld", http_code);
    if (body) {
        LOG_DEBUG("HTTP response body: %s", body);
    }
}

static int is_retryable_http_code(long http_code) {
    return (http_code == 429 || http_code >= 500);
}

static SSError map_http_code_to_error(long http_code) {
    if (http_code >= 200 && http_code < 300) return SS_OK;
    if (http_code == 401 || http_code == 403) return SS_ERR_API_AUTH;
    if (http_code == 429) return SS_ERR_API_LIMIT;
    if (http_code > 0) return SS_ERR_HTTP_RESPONSE;
    return SS_ERR_HTTP_REQUEST;
}

static struct curl_slist *build_headers(const char **headers, int header_count, int include_json_content_type) {
    struct curl_slist *request_headers = NULL;

    if (include_json_content_type) {
        request_headers = curl_slist_append(request_headers, "Content-Type: application/json");
    }

    for (int i = 0; i < header_count; ++i) {
        if (headers && headers[i]) {
            request_headers = curl_slist_append(request_headers, headers[i]);
        }
    }

    return request_headers;
}

static SSError perform_request(HttpMethod method,
                               const char *url,
                               const char *json_body,
                               const char **headers,
                               int header_count,
                               char **response_out) {
    if (!url || !response_out) return SS_ERR_NULL_PTR;

    *response_out = NULL;

    for (int attempt = 1; attempt <= HTTP_MAX_RETRIES; ++attempt) {
        CURL *curl = curl_easy_init();
        if (!curl) {
            return SS_ERR_HTTP_REQUEST;
        }

        HttpBuffer buffer = {0};
        struct curl_slist *request_headers = build_headers(headers, header_count, method == HTTP_METHOD_POST);
        char error_buffer[CURL_ERROR_SIZE] = {0};

        log_request(method, url, json_body);

        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &buffer);
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, g_timeout_sec > 0 ? g_timeout_sec : HTTP_DEFAULT_TIMEOUT_SEC);
        curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, g_timeout_sec > 0 ? g_timeout_sec : HTTP_DEFAULT_TIMEOUT_SEC);
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
        curl_easy_setopt(curl, CURLOPT_NOSIGNAL, 1L);
        curl_easy_setopt(curl, CURLOPT_ERRORBUFFER, error_buffer);

        if (request_headers) {
            curl_easy_setopt(curl, CURLOPT_HTTPHEADER, request_headers);
        }

        if (method == HTTP_METHOD_POST) {
            curl_easy_setopt(curl, CURLOPT_POST, 1L);
            curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_body ? json_body : "");
            curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, json_body ? (long)strlen(json_body) : 0L);
        } else {
            curl_easy_setopt(curl, CURLOPT_HTTPGET, 1L);
        }

        CURLcode curl_result = curl_easy_perform(curl);
        long http_code = 0;
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);

        if (curl_result == CURLE_OK) {
            log_response(http_code, buffer.data ? buffer.data : "");

            if (http_code >= 200 && http_code < 300) {
                http_buffer_finalize(&buffer);
                if (buffer.data) {
                    *response_out = buffer.data;
                    curl_slist_free_all(request_headers);
                    curl_easy_cleanup(curl);
                    return SS_OK;
                }

                curl_slist_free_all(request_headers);
                curl_easy_cleanup(curl);
                return SS_ERR_ALLOC;
            }

            if (is_retryable_http_code(http_code) && attempt < HTTP_MAX_RETRIES) {
                LOG_WARN("HTTP %ld retryable, tentative %d/%d", http_code, attempt, HTTP_MAX_RETRIES);
                http_buffer_reset(&buffer);
                curl_slist_free_all(request_headers);
                curl_easy_cleanup(curl);
                sleep_ms(HTTP_BACKOFF_INITIAL_MS << (attempt - 1));
                continue;
            }

            LOG_ERROR("HTTP request failed with status %ld", http_code);
            http_buffer_reset(&buffer);
            curl_slist_free_all(request_headers);
            curl_easy_cleanup(curl);
            return map_http_code_to_error(http_code);
        }

        if (attempt < HTTP_MAX_RETRIES) {
            const char *detail = error_buffer[0] ? error_buffer : curl_easy_strerror(curl_result);
            LOG_WARN("libcurl error: %s (tentative %d/%d)", detail, attempt, HTTP_MAX_RETRIES);
            http_buffer_reset(&buffer);
            curl_slist_free_all(request_headers);
            curl_easy_cleanup(curl);
            sleep_ms(HTTP_BACKOFF_INITIAL_MS << (attempt - 1));
            continue;
        }

        LOG_ERROR("libcurl error final: %s", error_buffer[0] ? error_buffer : curl_easy_strerror(curl_result));
        http_buffer_reset(&buffer);
        curl_slist_free_all(request_headers);
        curl_easy_cleanup(curl);
        return SS_ERR_HTTP_REQUEST;
    }

    return SS_ERR_HTTP_REQUEST;
}

SSError http_client_init(void) {
    if (g_curl_initialized) {
        return SS_OK;
    }

    const char *timeout_env = getenv("HTTP_TIMEOUT_SEC");
    if (timeout_env && *timeout_env) {
        long timeout_value = strtol(timeout_env, NULL, 10);
        if (timeout_value > 0) {
            g_timeout_sec = timeout_value;
        }
    }

    CURLcode res = curl_global_init(CURL_GLOBAL_ALL);
    if (res != CURLE_OK) {
        LOG_ERROR("curl_global_init failed: %s", curl_easy_strerror(res));
        return SS_ERR_HTTP_REQUEST;
    }

    g_curl_initialized = 1;
    return SS_OK;
}

void http_client_cleanup(void) {
    if (!g_curl_initialized) {
        return;
    }

    curl_global_cleanup();
    g_curl_initialized = 0;
}

void http_client_set_timeout(long timeout_seconds) {
    if (timeout_seconds > 0) {
        g_timeout_sec = timeout_seconds;
    } else {
        g_timeout_sec = HTTP_DEFAULT_TIMEOUT_SEC;
    }
}

SSError http_post(const char *url,
                  const char *json_body,
                  const char **headers_list,
                  int header_count,
                  char **response_out) {
    if (!url || !json_body || !response_out) return SS_ERR_NULL_PTR;

    return perform_request(HTTP_METHOD_POST, url, json_body, headers_list, header_count, response_out);
}

SSError http_get(const char *url,
                 const char **headers_list,
                 int header_count,
                 char **response_out) {
    if (!url || !response_out) return SS_ERR_NULL_PTR;

    return perform_request(HTTP_METHOD_GET, url, NULL, headers_list, header_count, response_out);
}
