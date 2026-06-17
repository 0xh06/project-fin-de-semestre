/**
 * @file rest_client.h
 * @brief Compatibilité avec l'ancienne couche REST.
 *
 * Cette couche délègue au client HTTP générique.
 */

#ifndef SMARTSTUDY_API_REST_CLIENT_H
#define SMARTSTUDY_API_REST_CLIENT_H

#include <stddef.h>
#include "core/error.h"

typedef struct {
    char *data;
    size_t size;
} HttpBody;

typedef struct {
    int status_code;
    HttpBody body;
} HttpResponse;

SSError http_init(void);
void http_cleanup(void);

SSError http_post_json(const char *url,
                       const char *json_body,
                       const char **headers,
                       int header_count,
                       HttpResponse *response);

SSError http_get_json(const char *url,
                      const char **headers,
                      int header_count,
                      HttpResponse *response);

void http_response_free(HttpResponse *response);

#endif /* SMARTSTUDY_API_REST_CLIENT_H */
