/**
 * @file error.c
 * @brief Implémentation des descriptions d'erreurs.
 */

#include "core/error.h"

const char *ss_error_str(SSError code) {
    switch (code) {
        case SS_OK:                return "Succès";
        case SS_ERR_GENERIC:       return "Erreur générique";
        case SS_ERR_NULL_PTR:      return "Pointeur NULL inattendu";
        case SS_ERR_ALLOC:         return "Échec d'allocation mémoire";
        case SS_ERR_FILE_NOT_FOUND:return "Fichier introuvable";
        case SS_ERR_FILE_READ:     return "Erreur de lecture fichier";
        case SS_ERR_DB_OPEN:       return "Impossible d'ouvrir la base SQLite";
        case SS_ERR_DB_QUERY:      return "Erreur d'exécution de requête SQL";
        case SS_ERR_DB_MIGRATE:    return "Erreur de migration de schéma";
        case SS_ERR_JSON_PARSE:    return "Erreur de parsing JSON";
        case SS_ERR_JSON_BUILD:    return "Erreur de construction JSON";
        case SS_ERR_HTTP_REQUEST:  return "Erreur de requête HTTP";
        case SS_ERR_HTTP_RESPONSE: return "Réponse HTTP invalide";
        case SS_ERR_API_AUTH:      return "Clé API invalide ou expirée";
        case SS_ERR_API_LIMIT:     return "Rate limit atteint";
        case SS_ERR_PDF_OPEN:      return "Impossible d'ouvrir le PDF";
        case SS_ERR_PDF_PARSE:     return "Erreur d'extraction du texte PDF";
        case SS_ERR_CONFIG:        return "Erreur de configuration";
        default:                   return "Code d'erreur inconnu";
    }
}
