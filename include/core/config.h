/**
 * @file config.h
 * @brief Gestion de la configuration depuis fichier .env.
 *
 * Parse les paires clé=valeur et expose un accès thread-safe.
 */

#ifndef SMARTSTUDY_CORE_CONFIG_H
#define SMARTSTUDY_CORE_CONFIG_H

#include <stddef.h>

/** Nombre maximum de paires clé-valeur supportées */
#define CONFIG_MAX_ENTRIES 64

/** Longueur maximale d'une clé ou d'une valeur */
#define CONFIG_MAX_LEN 512

/**
 * Charge la configuration depuis un fichier .env.
 * @param filepath  Chemin vers le fichier de configuration.
 * @return 0 en cas de succès, -1 si le fichier est introuvable.
 */
int config_load(const char *filepath);

/**
 * Récupère la valeur associée à une clé.
 * @param key           Nom de la variable d'environnement.
 * @param default_value Valeur par défaut si la clé n'existe pas.
 * @return Pointeur vers la valeur (statique, ne pas free).
 */
const char *config_get(const char *key, const char *default_value);

/**
 * Récupère une valeur entière.
 * @param key           Nom de la variable.
 * @param default_value Valeur par défaut.
 * @return Valeur parsée ou default_value.
 */
int config_get_int(const char *key, int default_value);

/**
 * Nettoie la mémoire allouée par la configuration.
 */
void config_free(void);

#define DB_MODE_LOCAL  0
#define DB_MODE_REMOTE 1

#endif /* SMARTSTUDY_CORE_CONFIG_H */
