/**
 * @file chat_engine.h
 * @brief Moteur de conversation IA contextuel avec documents.
 *
 * Orchestre les appels au provider IA Gemini,
 * gère l'historique de conversation et le contexte documentaire.
 */

#ifndef SMARTSTUDY_CHAT_CHAT_ENGINE_H
#define SMARTSTUDY_CHAT_CHAT_ENGINE_H

#include "core/error.h"
#include "db/models.h"
#include <stdint.h>

/** Réponse de chat avec métadonnées */
typedef struct {
    char   *content;              /**< Réponse IA (allouée) */
    int     tokens_used;          /**< Tokens utilisés pour la réponse */
    int     total_tokens;         /**< Total tokens (prompt + completion) */
    char   *model_used;           /**< Modèle IA utilisé (allouée) */
} ChatResponse;

/**
 * Envoie un message avec contexte documentaire.
 * @param user_id        ID de l'utilisateur
 * @param user_message   Message de l'utilisateur
 * @param document_ids   IDs des documents pour le contexte (NULL = aucun)
 * @param doc_count      Nombre de documents
 * @param out            Réponse IA (à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError chat_send(int64_t user_id, const char *user_message, 
                  int *document_ids, int doc_count, ChatResponse *out);

/**
 * Récupère l'historique de conversation.
 * @param user_id   ID de l'utilisateur
 * @param limit     Nombre maximum de messages (0 = tous)
 * @param out       Tableau de messages (alloué, à libérer)
 * @param count     Nombre de messages
 * @return SS_OK ou code d'erreur
 */
SSError chat_get_history(int64_t user_id, int limit, DBChatMessage **out, int *count);

/**
 * Efface l'historique de conversation d'un utilisateur.
 * @param user_id   ID de l'utilisateur
 * @return SS_OK ou code d'erreur
 */
SSError chat_clear_history(int64_t user_id);

/**
 * Génère des suggestions de questions de suivi.
 * @param last_message    Dernier message utilisateur
 * @param ai_response     Dernière réponse IA
 * @param suggestions_out Tableau de 3 suggestions (alloué, à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError chat_suggest_followup(const char *last_message, const char *ai_response, 
                             char ***suggestions_out);

/**
 * Libère une ChatResponse.
 * @param response  Réponse à libérer
 */
void chat_response_free(ChatResponse *response);

/**
 * Libère un tableau de suggestions.
 * @param suggestions  Tableau de suggestions
 */
void chat_suggestions_free(char **suggestions);

#endif /* SMARTSTUDY_CHAT_CHAT_ENGINE_H */
