/**
 * @file http_client.h
 * @brief Client HTTP robuste basé sur libcurl.
 *
 * Gère les requêtes POST/GET avec :
 * - Allocation dynamique de la mémoire
 * - Timeout configurable
 * - Retry automatique avec backoff exponentiel (3 tentatives)
 */

#ifndef SMARTSTUDY_API_HTTP_CLIENT_H
#define SMARTSTUDY_API_HTTP_CLIENT_H

#include <stddef.h>
#include "core/error.h"

/**
 * Initialise le sous-système HTTP (curl_global_init).
 * À appeler une fois au démarrage de l'app.
 */
SSError http_client_init(void);

/**
 * Nettoie le sous-système HTTP (curl_global_cleanup).
 * À appeler avant l'arrêt de l'app.
 */
void http_client_cleanup(void);

/**
 * Définit le timeout par défaut des requêtes HTTP.
 * @param timeout_seconds  Timeout en secondes. Si <= 0, la valeur par défaut est utilisée.
 */
void http_client_set_timeout(long timeout_seconds);

/**
 * Envoie une requête HTTP POST.
 * 
 * @param url           L'URL cible
 * @param json_body     Le payload JSON à envoyer
 * @param headers       Tableau de headers supplémentaires (ex: "Authorization: Bearer XXX")
 * @param header_count  Nombre de headers dans le tableau
 * @param response_out  Pointeur qui recevra le buffer alloué contenant la réponse
 * 
 * @note L'appelant DOIT appeler free() sur *response_out si le retour est SS_OK.
 * 
 * @return SS_OK en cas de succès, sinon un code d'erreur (SS_ERR_HTTP_REQUEST, etc.)
 */
SSError http_post(const char *url, 
                  const char *json_body, 
                  const char **headers, 
                  int header_count, 
                  char **response_out);

/**
 * Envoie une requête HTTP GET.
 * 
 * @param url           L'URL cible
 * @param headers       Tableau de headers supplémentaires
 * @param header_count  Nombre de headers dans le tableau
 * @param response_out  Pointeur qui recevra le buffer alloué contenant la réponse
 * 
 * @note L'appelant DOIT appeler free() sur *response_out si le retour est SS_OK.
 * 
 * @return SS_OK en cas de succès, sinon un code d'erreur.
 */
SSError http_get(const char *url, 
                 const char **headers, 
                 int header_count, 
                 char **response_out);

#endif /* SMARTSTUDY_API_HTTP_CLIENT_H */
