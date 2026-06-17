#ifndef SMARTSTUDY_JWT_H
#define SMARTSTUDY_JWT_H

#include <stdint.h>
#include <stdbool.h>

/**
 * @brief Génère un token JWT signé (HMAC-SHA256).
 *
 * @param user_id L'ID de l'utilisateur à encoder dans le payload.
 * @param secret_key La clé secrète utilisée pour signer le JWT.
 * @param expiration_seconds La durée de validité du token en secondes.
 * @return char* Le token JWT alloué dynamiquement (à libérer avec free), ou NULL en cas d'erreur.
 */
char* jwt_generate(int64_t user_id, const char *secret_key, int expiration_seconds);

/**
 * @brief Vérifie et décode un token JWT.
 *
 * @param token Le token JWT à valider.
 * @param secret_key La clé secrète pour vérifier la signature.
 * @param out_user_id Pointeur pour récupérer l'ID utilisateur si valide.
 * @return true si le token est valide et non expiré, false sinon.
 */
bool jwt_verify(const char *token, const char *secret_key, int64_t *out_user_id);

#endif // SMARTSTUDY_JWT_H
