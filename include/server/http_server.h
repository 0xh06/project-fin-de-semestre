#ifndef SMARTSTUDY_HTTP_SERVER_H
#define SMARTSTUDY_HTTP_SERVER_H

#include "core/app.h"
#include <stdbool.h>

/**
 * @brief Configuration du serveur HTTP
 */
typedef struct {
    const char *port;
    const char *jwt_secret;
} HttpServerConfig;

/**
 * @brief Démarre le serveur HTTP. Bloque l'exécution (boucle d'événements).
 * 
 * @param app Pointeur vers l'application initialisée (DB, etc.)
 * @param config Configuration du serveur
 * @return true si le serveur s'arrête proprement, false en cas d'erreur de démarrage.
 */
bool http_server_start(SmartStudyApp *app, const HttpServerConfig *config);

#endif // SMARTSTUDY_HTTP_SERVER_H
