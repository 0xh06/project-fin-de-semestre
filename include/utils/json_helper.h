/**
 * @file json_helper.h
 * @brief Utilitaires de haut niveau pour le parsing/génération JSON via cJSON.
 *
 * Simplifie l'extraction de champs courants et la construction
 * de payloads pour les API.
 */

#ifndef SMARTSTUDY_UTILS_JSON_HELPER_H
#define SMARTSTUDY_UTILS_JSON_HELPER_H

#include "cJSON/cJSON.h"
#include "core/error.h"

/**
 * Parse une chaîne JSON et retourne l'objet racine.
 * @param json_str  Chaîne JSON à parser.
 * @return Objet cJSON (à libérer avec cJSON_Delete), ou NULL en cas d'erreur.
 */
cJSON *json_parse(const char *json_str);

/**
 * Extrait un champ string d'un objet JSON.
 * @param root  Objet JSON parent.
 * @param key   Nom du champ.
 * @return Pointeur vers la chaîne (propriété de cJSON, ne pas free), ou NULL.
 */
const char *json_get_string(const cJSON *root, const char *key);

/**
 * Extrait un champ entier d'un objet JSON.
 * @param root          Objet JSON parent.
 * @param key           Nom du champ.
 * @param default_value Valeur par défaut si le champ n'existe pas.
 * @return Valeur entière du champ.
 */
int json_get_int(const cJSON *root, const char *key, int default_value);

/**
 * Extrait un champ double d'un objet JSON.
 * @param root          Objet JSON parent.
 * @param key           Nom du champ.
 * @param default_value Valeur par défaut.
 * @return Valeur double du champ.
 */
double json_get_double(const cJSON *root, const char *key, double default_value);

/**
 * Crée le payload JSON pour un appel Gemini generateContent.
 * @param user_prompt  Message utilisateur.
 * @return Chaîne JSON (allouée, à free par l'appelant).
 */
char *json_build_gemini_payload(const char *user_prompt);

#endif /* SMARTSTUDY_UTILS_JSON_HELPER_H */
