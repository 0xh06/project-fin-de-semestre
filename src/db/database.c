/**
 * @file database.c
 * @brief Implémentation de la couche d'accès SQLite.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sqlite3.h>
#include "db/database.h"
#include "utils/logger.h"

SSError db_open(const char *db_path, sqlite3 **db) {
    if (!db_path || !db) return SS_ERR_NULL_PTR;

    int rc = sqlite3_open(db_path, db);
    if (rc != SQLITE_OK) {
        LOG_ERROR("SQLite open error: %s", sqlite3_errmsg(*db));
        return SS_ERR_DB_OPEN;
    }

    /* Activer les clés étrangères */
    db_exec(*db, "PRAGMA foreign_keys = ON;");
    /* Mode WAL pour de meilleures performances en concurrence */
    db_exec(*db, "PRAGMA journal_mode = WAL;");

    LOG_INFO("Base de données ouverte : %s", db_path);
    return SS_OK;
}

void db_close(sqlite3 *db) {
    if (db) {
        sqlite3_close(db);
        LOG_INFO("Base de données fermée.");
    }
}

SSError db_exec(sqlite3 *db, const char *sql) {
    if (!db || !sql) return SS_ERR_NULL_PTR;

    char *err_msg = NULL;
    int rc = sqlite3_exec(db, sql, NULL, NULL, &err_msg);
    if (rc != SQLITE_OK) {
        LOG_ERROR("SQL exec error: %s", err_msg);
        sqlite3_free(err_msg);
        return SS_ERR_DB_QUERY;
    }
    return SS_OK;
}

SSError db_migrate(sqlite3 *db, const char *schema_path) {
    if (!db || !schema_path) return SS_ERR_NULL_PTR;

    /* Lire le fichier SQL */
    FILE *fp = fopen(schema_path, "r");
    if (!fp) {
        LOG_ERROR("Fichier de schéma introuvable : %s", schema_path);
        return SS_ERR_FILE_NOT_FOUND;
    }

    fseek(fp, 0, SEEK_END);
    long fsize = ftell(fp);
    fseek(fp, 0, SEEK_SET);

    char *sql = malloc(fsize + 1);
    if (!sql) {
        fclose(fp);
        return SS_ERR_ALLOC;
    }

    size_t read = fread(sql, 1, fsize, fp);
    sql[read] = '\0';
    fclose(fp);

    /* Exécuter le schéma */
    SSError err = db_exec(db, sql);
    free(sql);

    if (err == SS_OK) {
        LOG_INFO("Migration du schéma appliquée avec succès.");
    } else {
        LOG_ERROR("Échec de la migration du schéma.");
        err = SS_ERR_DB_MIGRATE;
    }

    return err;
}
