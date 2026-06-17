/**
 * @file rest_client.c
 * @brief Compatibilité REST construite sur le client HTTP.
 */

#include <stdlib.h>
#include <string.h>
#include "api/rest_client.h"
#include "api/http_client.h"

static SSError fill_response(HttpResponse *response, char *body) {
    if (!response) return SS_ERR_NULL_PTR;

    response->status_code = 200;
    response->body.data = body;
    response->body.size = body ? strlen(body) : 0;
    return SS_OK;
}

SSError http_init(void) {
    return http_client_init();
}

void http_cleanup(void) {
    http_client_cleanup();
}

SSError http_post_json(const char *url,
                       const char *json_body,
                       const char **headers,
                       int header_count,
                       HttpResponse *response) {
    if (!response) return SS_ERR_NULL_PTR;

    response->status_code = 0;
    response->body.data = NULL;
    response->body.size = 0;

    char *body = NULL;
    SSError err = http_post(url, json_body, headers, header_count, &body);
    if (err != SS_OK) {
        free(body);
        return err;
    }

    return fill_response(response, body);
}

SSError http_get_json(const char *url,
                      const char **headers,
                      int header_count,
                      HttpResponse *response) {
    if (!response) return SS_ERR_NULL_PTR;

    response->status_code = 0;
    response->body.data = NULL;
    response->body.size = 0;

    char *body = NULL;
    SSError err = http_get(url, headers, header_count, &body);
    if (err != SS_OK) {
        free(body);
        return err;
    }

    return fill_response(response, body);
}

void http_response_free(HttpResponse *response) {
    if (!response) return;

    free(response->body.data);
    response->body.data = NULL;
    response->body.size = 0;
    response->status_code = 0;
}
