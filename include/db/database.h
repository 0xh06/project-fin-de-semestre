/**
 * @file database.h
 * @brief Couche d'abstraction SQLite.
 *
 * Gère l'ouverture/fermeture de la connexion, l'exécution de requêtes
 * et l'application du schéma de migration.
 */

#ifndef SMARTSTUDY_DB_DATABASE_H
#define SMARTSTUDY_DB_DATABASE_H

#include <sqlite3.h>
#include "core/error.h"

/**
 * Ouvre (ou crée) la base de données SQLite.
 * @param db_path  Chemin vers le fichier .db.
 * @param db       Pointeur de sortie vers le handle sqlite3.
 * @return SS_OK ou code d'erreur.
 */
SSError db_open(const char *db_path, sqlite3 **db);

/**
 * Ferme la connexion à la base.
 * @param db  Handle sqlite3 à fermer.
 */
void db_close(sqlite3 *db);

/**
 * Exécute une requête SQL sans résultat (INSERT, UPDATE, DELETE, DDL).
 * @param db   Handle sqlite3.
 * @param sql  Requête SQL à exécuter.
 * @return SS_OK ou SS_ERR_DB_QUERY.
 */
SSError db_exec(sqlite3 *db, const char *sql);

/**
 * Applique le schéma initial depuis un fichier .sql.
 * @param db          Handle sqlite3.
 * @param schema_path Chemin vers le fichier schema.sql.
 * @return SS_OK ou SS_ERR_DB_MIGRATE.
 */
SSError db_migrate(sqlite3 *db, const char *schema_path);

#endif /* SMARTSTUDY_DB_DATABASE_H */
