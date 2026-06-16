/**
 * @file chat_engine.h
 * @brief Moteur de conversation IA contextuel.
 *
 * Orchestre les appels au provider IA Gemini,
 * gère l'historique de conversation et le contexte documentaire.
 */

#ifndef SMARTSTUDY_CHAT_CHAT_ENGINE_H
#define SMARTSTUDY_CHAT_CHAT_ENGINE_H

#include <sqlite3.h>
#include "core/error.h"
#include "db/models.h"
#include "api/gemini.h"

/** Provider IA supportés */
typedef enum {
    AI_PROVIDER_GEMINI,
} AIProvider;

/**
 * Crée une nouvelle session de chat.
 * @param db           Handle SQLite.
 * @param user_id      ID de l'utilisateur.
 * @param document_id  ID du document contextuel (0 = chat libre).
 * @param provider     Provider IA à utiliser.
 * @param session_id   Pointeur de sortie pour l'ID de session créée.
 * @return SS_OK ou code d'erreur.
 */
SSError chat_create_session(sqlite3 *db,
                            int64_t user_id,
                            int64_t document_id,
                            AIProvider provider,
                            int64_t *session_id);

/**
 * Envoie un message utilisateur et reçoit la réponse de l'IA.
 * L'historique est automatiquement sauvegardé en base.
 * @param db         Handle SQLite.
 * @param session_id ID de la session.
 * @param user_msg   Message de l'utilisateur.
 * @param response   Pointeur de sortie vers la réponse IA.
 * @return SS_OK ou code d'erreur.
 */
SSError chat_send_message(sqlite3 *db,
                          int64_t session_id,
                          const char *user_msg,
                          AIResponse *response);

/**
 * Convertit une chaîne en AIProvider.
 * @param name  "gemini".
 * @return Le provider correspondant (GEMINI par défaut).
 */
AIProvider chat_provider_from_string(const char *name);

#endif /* SMARTSTUDY_CHAT_CHAT_ENGINE_H */
