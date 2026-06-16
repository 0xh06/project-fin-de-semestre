/**
 * @file rest_client.h
 * @brief Client HTTP générique basé sur libcurl.
 *
 * Fournit des primitives POST/GET réutilisables par les modules API
 * (OpenAI, Gemini, Mistral).
 */

#ifndef SMARTSTUDY_API_REST_CLIENT_H
#define SMARTSTUDY_API_REST_CLIENT_H

#include <stddef.h>
#include "core/error.h"

/** Buffer dynamique pour accumuler les réponses HTTP */
typedef struct {
    char  *data;      /**< Contenu de la réponse (alloué par realloc) */
    size_t size;      /**< Taille courante en octets */
    size_t capacity;  /**< Capacité allouée */
} HttpBuffer;

/** Résultat d'une requête HTTP */
typedef struct {
    int         status_code;  /**< Code HTTP (200, 401, 429, ...) */
    HttpBuffer  body;         /**< Corps de la réponse */
} HttpResponse;

/**
 * Initialise le sous-système HTTP (appelle curl_global_init).
 * À appeler une seule fois au démarrage.
 * @return SS_OK ou SS_ERR_HTTP_REQUEST.
 */
SSError http_init(void);

/**
 * Nettoie le sous-système HTTP (appelle curl_global_cleanup).
 * À appeler une seule fois à la fermeture.
 */
void http_cleanup(void);

/**
 * Envoie une requête POST JSON.
 * @param url        URL cible.
 * @param json_body  Corps JSON à envoyer.
 * @param auth_token Token Bearer (NULL si pas d'auth).
 * @param response   Pointeur de sortie vers la réponse.
 * @return SS_OK ou code d'erreur HTTP.
 */
SSError http_post_json(const char *url,
                       const char *json_body,
                       const char *auth_token,
                       HttpResponse *response);

/**
 * Envoie une requête GET.
 * @param url        URL cible.
 * @param auth_token Token Bearer (NULL si pas d'auth).
 * @param response   Pointeur de sortie vers la réponse.
 * @return SS_OK ou code d'erreur HTTP.
 */
SSError http_get(const char *url,
                 const char *auth_token,
                 HttpResponse *response);

/**
 * Libère la mémoire d'une HttpResponse.
 * @param response  Réponse à libérer.
 */
void http_response_free(HttpResponse *response);

#endif /* SMARTSTUDY_API_REST_CLIENT_H */
