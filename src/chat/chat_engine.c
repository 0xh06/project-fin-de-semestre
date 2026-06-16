/**
 * @file chat_engine.c
 * @brief Implémentation du moteur de conversation IA.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sqlite3.h>
#include "chat/chat_engine.h"
#include "api/gemini.h"
#include "core/config.h"
#include "utils/logger.h"

AIProvider chat_provider_from_string(const char *name) {
    (void)name;
    return AI_PROVIDER_GEMINI;
}

static const char *provider_to_string(AIProvider provider) {
    (void)provider;
    return "gemini";
}

SSError chat_create_session(sqlite3 *db,
                            int64_t user_id,
                            int64_t document_id,
                            AIProvider provider,
                            int64_t *session_id) {
    if (!db || !session_id) return SS_ERR_NULL_PTR;

    const char *sql =
        "INSERT INTO chat_sessions (user_id, document_id, ai_provider) VALUES (?, ?, ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, user_id);
    sqlite3_bind_int64(stmt, 2, document_id);
    sqlite3_bind_text(stmt, 3, provider_to_string(provider), -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) return SS_ERR_DB_QUERY;

    *session_id = sqlite3_last_insert_rowid(db);
    LOG_INFO("Session de chat créée : id=%lld, provider=%s",
             (long long)*session_id, provider_to_string(provider));
    return SS_OK;
}

SSError chat_send_message(sqlite3 *db,
                          int64_t session_id,
                          const char *user_msg,
                          AIResponse *response) {
    if (!db || !user_msg || !response) return SS_ERR_NULL_PTR;

    /* 1. Sauvegarder le message utilisateur en base */
    const char *insert_sql =
        "INSERT INTO chat_messages (session_id, role, content) VALUES (?, 'user', ?);";

    sqlite3_stmt *stmt;
    sqlite3_prepare_v2(db, insert_sql, -1, &stmt, NULL);
    sqlite3_bind_int64(stmt, 1, session_id);
    sqlite3_bind_text(stmt, 2, user_msg, -1, SQLITE_STATIC);
    sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    /* 2. Récupérer le provider de la session */
    const char *sel_sql = "SELECT ai_provider FROM chat_sessions WHERE id = ?;";
    sqlite3_prepare_v2(db, sel_sql, -1, &stmt, NULL);
    sqlite3_bind_int64(stmt, 1, session_id);

    char provider_name[32] = "gemini";
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        strncpy(provider_name, (const char *)sqlite3_column_text(stmt, 0), 31);
    }
    sqlite3_finalize(stmt);

    AIProvider provider = chat_provider_from_string(provider_name);

    /* 3. Construire le prompt système contextuel */
    const char *system_prompt =
        "Tu es SmartStudy AI, un assistant d'étude intelligent. "
        "Aide l'étudiant à comprendre ses cours, résume les concepts clés "
        "et propose des exercices de révision.";

    /* 4. Appeler le provider IA approprié */
    SSError err;
    const char *api_key;

    (void)provider;
    api_key = config_get("GEMINI_API_KEY", "");
    err = gemini_chat(api_key, NULL, system_prompt, user_msg, response);

    if (err != SS_OK) {
        LOG_ERROR("Erreur IA (%s) : %d", provider_name, err);
        return err;
    }

    /* 5. Sauvegarder la réponse IA en base */
    sqlite3_prepare_v2(db, insert_sql, -1, &stmt, NULL);
    sqlite3_bind_int64(stmt, 1, session_id);
    /* Réutiliser insert_sql mais avec role=assistant */
    sqlite3_finalize(stmt);

    const char *resp_sql =
        "INSERT INTO chat_messages (session_id, role, content, tokens) VALUES (?, 'assistant', ?, ?);";
    sqlite3_prepare_v2(db, resp_sql, -1, &stmt, NULL);
    sqlite3_bind_int64(stmt, 1, session_id);
    sqlite3_bind_text(stmt, 2, response->content, -1, SQLITE_STATIC);
    sqlite3_bind_int(stmt, 3, response->completion_tokens);
    sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    return SS_OK;
}
