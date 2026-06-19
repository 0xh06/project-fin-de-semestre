/**
 * @file flashcard_srs.c
 * @brief Implémentation de l'algorithme SM-2 de répétition espacée.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <math.h>
#include "flashcard/flashcard_srs.h"
#include "db/db.h"
#include "api/ai_client.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

#define DEFAULT_EASINESS 2.5f
#define MIN_EASINESS 1.3f
#define SECONDS_PER_DAY 86400

/**
 * Algorithme SM-2 (SuperMemo 2).
 * Formules originales:
 * - E' = E + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 * - I(1) = 1
 * - I(2) = 6
 * - I(n) = I(n-1) * E' pour n > 2
 * - Si q < 3, répétitions = 0, I = 1
 */
SSError srs_calculate_next_review(int quality, int repetitions, float easiness, 
                                   int interval, SRSResult *out) {
    if (!out || quality < 0 || quality > 5) {
        return SS_ERR_INVALID_PARAM;
    }

    memset(out, 0, sizeof(SRSResult));

    // Calcul du nouveau E-Factor
    float new_easiness = easiness + (0.1f - (5 - quality) * (0.08f + (5 - quality) * 0.02f));
    if (new_easiness < MIN_EASINESS) {
        new_easiness = MIN_EASINESS;
    }

    int new_repetitions;
    int new_interval;

    if (quality < 3) {
        // Échec: réinitialiser
        new_repetitions = 0;
        new_interval = 1;
    } else {
        // Succès: incrémenter répétitions
        new_repetitions = repetitions + 1;

        if (new_repetitions == 1) {
            new_interval = 1;
        } else if (new_repetitions == 2) {
            new_interval = 6;
        } else {
            new_interval = (int)ceil(interval * new_easiness);
        }
    }

    out->new_interval = new_interval;
    out->new_easiness = new_easiness;
    out->new_repetitions = new_repetitions;

    // Calcul du timestamp de prochaine révision
    time_t now = time(NULL);
    out->next_review_ts = now + (new_interval * SECONDS_PER_DAY);

    // Format date YYYY-MM-DD
    struct tm *tm_info = localtime(&out->next_review_ts);
    strftime(out->next_review_date, sizeof(out->next_review_date), "%Y-%m-%d", tm_info);

    return SS_OK;
}

SSError flashcard_review(int64_t flashcard_id, int quality, char **next_review_out) {
    if (quality < 0 || quality > 5 || !next_review_out) {
        return SS_ERR_INVALID_PARAM;
    }

    // Récupérer la flashcard actuelle depuis la base
    // Note: nécessite une fonction db_flashcard_get_by_id dans db.h
    // Pour l'instant, on utilise une approche simplifiée avec update direct
    
    SRSResult srs_result;
    // Valeurs par défaut si non disponibles en base
    float current_easiness = DEFAULT_EASINESS;
    int current_repetitions = 0;
    int current_interval = 1;

    SSError err = srs_calculate_next_review(quality, current_repetitions, 
                                             current_easiness, current_interval, &srs_result);
    if (err != SS_OK) {
        return err;
    }

    // Mise à jour en base
    DBError db_err = flashcard_update_review(flashcard_id, srs_result.new_easiness,
                                              srs_result.new_interval, 
                                              srs_result.next_review_date);
    if (db_err != DB_OK) {
        LOG_ERROR("Erreur mise à jour flashcard %lld: %s", flashcard_id, db_error_msg());
        return SS_ERR_DB_QUERY;
    }

    *next_review_out = strdup(srs_result.next_review_date);
    if (!*next_review_out) {
        return SS_ERR_ALLOC;
    }

    LOG_INFO("Flashcard %lld révisée (qualité=%d), prochaine: %s", 
             flashcard_id, quality, srs_result.next_review_date);

    return SS_OK;
}

SSError flashcard_get_due_today(int64_t user_id, DBFlashcard **out, int *count) {
    if (!out || !count) {
        return SS_ERR_NULL_PTR;
    }

    // Utiliser la fonction existante de db.h
    DBError db_err = flashcard_list_due_today(user_id, out, count);
    if (db_err != DB_OK) {
        LOG_ERROR("Erreur récupération flashcards dues: %s", db_error_msg());
        return SS_ERR_DB_QUERY;
    }

    LOG_INFO("%d flashcards à réviser aujourd'hui pour user %lld", *count, user_id);
    return SS_OK;
}

SSError flashcard_get_stats(int64_t user_id, FlashcardStats *out) {
    if (!out) {
        return SS_ERR_NULL_PTR;
    }

    memset(out, 0, sizeof(FlashcardStats));

    // Récupérer toutes les flashcards de l'utilisateur
    DBFlashcard *all_cards = NULL;
    int total_count = 0;
    
    DBError db_err = flashcard_list_due_today(user_id, &all_cards, &total_count);
    if (db_err != DB_OK) {
        // flashcard_list_due_today ne retourne que les dues, on a besoin d'une autre fonction
        // Pour l'instant, on utilise une approximation
        LOG_WARN("Statistiques partielles (fonction db_flashcard_get_all requise)");
        return SS_OK;
    }

    out->due_today = total_count;

    // Calculer les statistiques
    time_t now = time(NULL);
    time_t week_later = now + (7 * SECONDS_PER_DAY);

    for (int i = 0; i < total_count; i++) {
        out->total_cards++;
        
        if (all_cards[i].interval_days > 21) {
            out->mastered_cards++;
        } else {
            out->learning_cards++;
        }

        out->average_easiness += all_cards[i].difficulty;

        // Vérifier si due cette semaine
        // Note: nécessite parsing de next_review_date
    }

    if (total_count > 0) {
        out->average_easiness /= total_count;
    }

    flashcard_list_free(all_cards, total_count);

    return SS_OK;
}

SSError flashcard_generate_from_text(const char *text, int64_t user_id, 
                                     int64_t document_id, int *count_out) {
    if (!text || !count_out) {
        return SS_ERR_NULL_PTR;
    }

    *count_out = 0;

    char prompt[8192];
    snprintf(prompt, sizeof(prompt),
        "Génère 5 à 10 flashcards (question/réponse) en français basées sur ce texte. "
        "Format JSON: [{\"question\": \"...\", \"answer\": \"...\"}]\n\nTexte:\n%s",
        text);

    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        return err;
    }

    cJSON *root = json_parse(response_json);
    free(response_json);

    if (!root) {
        return SS_ERR_JSON_PARSE;
    }

    const char *text_content = json_get_string(root, "text");
    if (!text_content) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *cards_array = cJSON_Parse(text_content);
    cJSON_Delete(root);

    if (!cards_array || !cJSON_IsArray(cards_array)) {
        return SS_ERR_JSON_PARSE;
    }

    int array_size = cJSON_GetArraySize(cards_array);
    int generated_count = 0;

    for (int i = 0; i < array_size; i++) {
        cJSON *card_obj = cJSON_GetArrayItem(cards_array, i);
        if (!card_obj) continue;

        const char *question = json_get_string(card_obj, "question");
        const char *answer = json_get_string(card_obj, "answer");

        if (!question || !answer) continue;

        DBFlashcard card;
        memset(&card, 0, sizeof(card));
        card.user_id = user_id;
        card.document_id = document_id;
        card.front = strdup(question);
        card.back = strdup(answer);
        card.difficulty = DEFAULT_EASINESS;
        card.interval_days = 1;
        
        time_t now = time(NULL);
        struct tm *tm_info = localtime(&now);
        char timestamp[16];
        strftime(timestamp, sizeof(timestamp), "%Y-%m-%d", tm_info);
        card.next_review = strdup(timestamp);

        int64_t card_id;
        DBError db_err = flashcard_save(&card, &card_id);

        free(card.front);
        free(card.back);
        free(card.next_review);

        if (db_err == DB_OK) {
            generated_count++;
        } else {
            LOG_WARN("Erreur sauvegarde flashcard %d", i);
        }
    }

    cJSON_Delete(cards_array);

    *count_out = generated_count;
    LOG_INFO("%d flashcards générées depuis texte", generated_count);

    return SS_OK;
}

SSError flashcard_auto_difficulty(const char *question, const char *answer, 
                                  int *difficulty_out) {
    if (!question || !answer || !difficulty_out) {
        return SS_ERR_NULL_PTR;
    }

    char prompt[4096];
    snprintf(prompt, sizeof(prompt),
        "Évalue la difficulté de cette flashcard sur une échelle de 1 à 5. "
        "1: très facile, 5: très difficile. "
        "Réponds uniquement avec le chiffre.\n\n"
        "Question: %s\n"
        "Réponse: %s",
        question, answer);

    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        return err;
    }

    cJSON *root = json_parse(response_json);
    free(response_json);

    if (!root) {
        return SS_ERR_JSON_PARSE;
    }

    const char *text_content = json_get_string(root, "text");
    if (!text_content) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    int difficulty = atoi(text_content);
    if (difficulty < 1) difficulty = 1;
    if (difficulty > 5) difficulty = 5;

    cJSON_Delete(root);

    *difficulty_out = difficulty;
    return SS_OK;
}
