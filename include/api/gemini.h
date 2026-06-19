/**
 * @file gemini.h
 * @brief Client pour l'API Google Gemini.
 *
 * Implémente l'appel vers generateContent.
 */

#ifndef SMARTSTUDY_API_GEMINI_H
#define SMARTSTUDY_API_GEMINI_H

/** Réponse parsée d'un appel IA */
typedef struct {
    char *content;       /**< Texte de la réponse (alloué, à free par l'appelant) */
    int   prompt_tokens; /**< Tokens du prompt */
    int   completion_tokens; /**< Tokens de la complétion */
} AIResponse;

/** Libère la mémoire d'une AIResponse. */
void ai_response_free(AIResponse *response);
#include "core/error.h"

/**
 * Envoie un prompt à l'API Gemini et récupère la réponse.
 * @param api_key       Clé API Gemini.
 * @param model         Nom du modèle (ex: "gemini-2.0-flash").
 * @param system_prompt Prompt système.
 * @param user_prompt   Message utilisateur.
 * @param response      Pointeur de sortie.
 * @return SS_OK ou code d'erreur.
 */
SSError gemini_chat(const char *api_key,
                    const char *model,
                    const char *system_prompt,
                    const char *user_prompt,
                    AIResponse *response);

#endif /* SMARTSTUDY_API_GEMINI_H */
