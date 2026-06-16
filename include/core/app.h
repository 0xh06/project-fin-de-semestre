/**
 * @file app.h
 * @brief Cycle de vie de l'application SmartStudy AI.
 *
 * Initialisation globale (DB, config, logging) et shutdown propre.
 */

#ifndef SMARTSTUDY_CORE_APP_H
#define SMARTSTUDY_CORE_APP_H

/**
 * Contexte global de l'application.
 * Regroupe les handles partagés (DB, config) pour éviter les globals dispersées.
 */
typedef struct {
    void *db_handle;       /* Handle sqlite3* (opaque ici pour découplage) */
    char *config_path;     /* Chemin vers le fichier .env */
    int   is_initialized;  /* Flag d'initialisation */
} SmartStudyApp;

/**
 * Initialise l'application : charge la config, ouvre la DB, applique les migrations.
 * @param app       Pointeur vers le contexte applicatif à initialiser.
 * @param env_path  Chemin vers le fichier .env (NULL = ".env" par défaut).
 * @return 0 en cas de succès, code d'erreur sinon.
 */
int app_init(SmartStudyApp *app, const char *env_path);

/**
 * Libère toutes les ressources et ferme proprement l'application.
 * @param app  Pointeur vers le contexte applicatif.
 */
void app_shutdown(SmartStudyApp *app);

/**
 * Retourne la version de l'application sous forme de chaîne.
 */
const char *app_version(void);

#endif /* SMARTSTUDY_CORE_APP_H */
