/**
 * @file ai_client.h
 * @brief Client IA haut niveau basé sur le client HTTP.
 *
 * Pour l'instant, seul Gemini est supporté.
 */

#ifndef SMARTSTUDY_API_AI_CLIENT_H
#define SMARTSTUDY_API_AI_CLIENT_H

#include "core/error.h"

/**
 * Appelle Gemini et retourne la réponse JSON brute.
 * @param prompt            Prompt utilisateur.
 * @param response_json_out Pointeur recevant la réponse JSON allouée.
 * @return SS_OK ou code d'erreur.
 */
SSError gemini_generate(const char *prompt, char **response_json_out);

#endif /* SMARTSTUDY_API_AI_CLIENT_H */
