/**
 * @file app.c
 * @brief Implémentation du cycle de vie applicatif.
 */

#include <stdlib.h>
#include <string.h>
#include "core/app.h"
#include "core/config.h"
#include "core/error.h"
#include "db/database.h"
#include "api/rest_client.h"
#include "utils/logger.h"

#define SMARTSTUDY_VERSION "0.1.0"

int app_init(SmartStudyApp *app, const char *env_path) {
    if (!app) return SS_ERR_NULL_PTR;

    memset(app, 0, sizeof(SmartStudyApp));

    /* 1. Charger la configuration */
    const char *path = env_path ? env_path : ".env";
    if (config_load(path) != 0) {
        LOG_WARN("Fichier .env introuvable (%s), utilisation des valeurs par défaut.", path);
    }
    app->config_path = str_dup(path);

    /* 2. Initialiser le logger */
    const char *log_level_str = config_get("LOG_LEVEL", "INFO");
    LogLevel level = LOG_INFO;
    if (strcmp(log_level_str, "DEBUG") == 0) level = LOG_DEBUG;
    else if (strcmp(log_level_str, "WARN") == 0)  level = LOG_WARN;
    else if (strcmp(log_level_str, "ERROR") == 0) level = LOG_ERROR;
    logger_init(level, NULL);

    /* 3. Ouvrir la base de données SQLite */
    const char *db_path = config_get("SMARTSTUDY_DB_PATH", "./data/smartstudy.db");
    SSError err = db_open(db_path, (sqlite3 **)&app->db_handle);
    if (err != SS_OK) {
        LOG_ERROR("Impossible d'ouvrir la base : %s", db_path);
        return err;
    }

    /* 4. Appliquer les migrations */
    err = db_migrate((sqlite3 *)app->db_handle, "./data/schema.sql");
    if (err != SS_OK) {
        LOG_ERROR("Échec de la migration du schéma.");
        return err;
    }

    /* 5. Initialiser le sous-système HTTP */
    err = http_init();
    if (err != SS_OK) {
        LOG_ERROR("Échec de l'initialisation HTTP (libcurl).");
        return err;
    }

    app->is_initialized = 1;
    LOG_INFO("Application initialisée avec succès.");
    return SS_OK;
}

void app_shutdown(SmartStudyApp *app) {
    if (!app) return;

    if (app->db_handle) {
        db_close((sqlite3 *)app->db_handle);
        app->db_handle = NULL;
    }

    http_cleanup();
    config_free();

    if (app->config_path) {
        free(app->config_path);
        app->config_path = NULL;
    }

    app->is_initialized = 0;
    LOG_INFO("Application fermée proprement.");
}

const char *app_version(void) {
    return SMARTSTUDY_VERSION;
}
