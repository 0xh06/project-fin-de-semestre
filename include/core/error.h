/**
 * @file error.h
 * @brief Codes d'erreur centralisés et gestion des erreurs.
 *
 * Tous les modules retournent ces codes pour un traitement uniforme.
 */

#ifndef SMARTSTUDY_CORE_ERROR_H
#define SMARTSTUDY_CORE_ERROR_H

/** Codes d'erreur de l'application */
typedef enum {
    SS_OK                =  0,  /**< Succès */
    SS_ERR_GENERIC       = -1,  /**< Erreur générique */
    SS_ERR_NULL_PTR      = -2,  /**< Pointeur NULL inattendu */
    SS_ERR_ALLOC         = -3,  /**< Échec d'allocation mémoire */
    SS_ERR_FILE_NOT_FOUND= -4,  /**< Fichier introuvable */
    SS_ERR_FILE_READ     = -5,  /**< Erreur de lecture fichier */
    SS_ERR_DB_OPEN       = -10, /**< Impossible d'ouvrir la base SQLite */
    SS_ERR_DB_QUERY      = -11, /**< Erreur d'exécution de requête SQL */
    SS_ERR_DB_MIGRATE    = -12, /**< Erreur lors de la migration */
    SS_ERR_JSON_PARSE    = -20, /**< Erreur de parsing JSON */
    SS_ERR_JSON_BUILD    = -21, /**< Erreur de construction JSON */
    SS_ERR_HTTP_REQUEST  = -30, /**< Erreur de requête HTTP */
    SS_ERR_HTTP_RESPONSE = -31, /**< Réponse HTTP invalide */
    SS_ERR_API_AUTH      = -32, /**< Clé API invalide ou expirée */
    SS_ERR_API_LIMIT     = -33, /**< Rate limit atteint */
    SS_ERR_PDF_OPEN      = -40, /**< Impossible d'ouvrir le PDF */
    SS_ERR_PDF_PARSE     = -41, /**< Erreur d'extraction du texte PDF */
    SS_ERR_CONFIG        = -50, /**< Erreur de configuration */
} SSError;

/**
 * Retourne une description humaine d'un code d'erreur.
 * @param code  Code d'erreur SSError.
 * @return Chaîne de description (statique).
 */
const char *ss_error_str(SSError code);

#endif /* SMARTSTUDY_CORE_ERROR_H */
