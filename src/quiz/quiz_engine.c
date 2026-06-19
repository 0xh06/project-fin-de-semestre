/**
 * @file quiz_engine.c
 * @brief Implémentation du moteur de quiz adaptatif.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <stdbool.h>
#include "quiz/quiz_engine.h"
#include "api/ai_client.h"
#include "db/db.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

#define MAX_WEAK_TOPICS 10
#define MAX_RECOMMENDATIONS 5

/**
 * Mélange un tableau d'entiers (Fisher-Yates).
 */
static void shuffle_int_array(int *array, int size) {
    for (int i = size - 1; i > 0; i--) {
        int j = rand() % (i + 1);
        int temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

/**
 * Convertit le niveau de difficulté en chaîne.
 */
static const char* difficulty_to_string(QuizDifficulty diff) {
    switch (diff) {
        case QUIZ_DIFFICULTY_EASY: return "facile";
        case QUIZ_DIFFICULTY_MEDIUM: return "moyen";
        case QUIZ_DIFFICULTY_HARD: return "difficile";
        default: return "auto";
    }
}

/**
 * Convertit le mode de quiz en chaîne.
 */
static const char* mode_to_string(QuizMode mode) {
    switch (mode) {
        case QUIZ_MODE_MULTIPLE_CHOICE: return "choix multiples";
        case QUIZ_MODE_TRUE_FALSE: return "vrai/faux";
        case QUIZ_MODE_OPEN_ENDED: return "réponse ouverte";
        default: return "inconnu";
    }
}

/**
 * Récupère le contenu texte des documents pour la génération de questions.
 */
static SSError get_documents_content(int *document_ids, int doc_count, char **content_out) {
    // Note: nécessite une fonction db_document_get_content dans db.h
    // Pour l'instant, on retourne un placeholder
    *content_out = strdup("Contenu des documents pour génération de questions.");
    return *content_out ? SS_OK : SS_ERR_ALLOC;
}

SSError quiz_create_session(int64_t user_id, int *document_ids, int doc_count,
                            QuizConfig config, int64_t *session_id_out) {
    if (!document_ids || doc_count <= 0 || !session_id_out) {
        return SS_ERR_NULL_PTR;
    }

    // Créer la session en mémoire
    QuizSession session;
    memset(&session, 0, sizeof(session));
    session.user_id = user_id;
    session.document_ids = malloc(doc_count * sizeof(int));
    if (!session.document_ids) {
        return SS_ERR_ALLOC;
    }
    memcpy(session.document_ids, document_ids, doc_count * sizeof(int));
    session.document_count = doc_count;
    session.config = config;
    session.created_at = time(NULL);
    session.started_at = 0;
    session.finished_at = 0;
    session.current_question_index = 0;
    session.questions_generated = 0;
    session.is_active = true;

    // Sauvegarder en base de données
    // Note: nécessite table quiz_sessions dans schema.sql
    // Pour l'instant, simulation avec un ID généré
    static int64_t next_session_id = 1;
    *session_id_out = next_session_id++;
    
    session.id = *session_id_out;

    LOG_INFO("Session quiz créée: ID=%lld, user=%lld, mode=%s, questions=%d",
             session.id, user_id, mode_to_string(config.mode), config.question_count);

    // Libérer la mémoire temporaire
    free(session.document_ids);

    return SS_OK;
}

SSError quiz_generate_question(QuizSession *session, int question_index, Question *out) {
    if (!session || !out) {
        return SS_ERR_NULL_PTR;
    }

    memset(out, 0, sizeof(Question));
    out->session_id = session->id;
    out->question_index = question_index;
    out->mode = session->config.mode;
    out->difficulty = session->config.difficulty;
    out->generated_at = time(NULL);

    // Récupérer le contenu des documents
    char *content = NULL;
    SSError err = get_documents_content(session->document_ids, session->document_count, &content);
    if (err != SS_OK) {
        return err;
    }

    char prompt[16384];
    const char *difficulty_str = difficulty_to_string(session->config.difficulty);
    const char *mode_str = mode_to_string(session->config.mode);

    // Construire le prompt selon le mode
    if (session->config.mode == QUIZ_MODE_MULTIPLE_CHOICE) {
        snprintf(prompt, sizeof(prompt),
            "Génère une question de quiz en français sur ce contenu. "
            "Niveau: %s. Mode: %s. "
            "Format JSON: {\"question\": \"...\", \"topic\": \"...\", "
            "\"options\": [\"A\", \"B\", \"C\", \"D\"], \"correct\": 0, \"explanation\": \"...\"}\n"
            "correct est l'index de la bonne réponse (0-3).\n\nContenu:\n%s",
            difficulty_str, mode_str, content);
    } else if (session->config.mode == QUIZ_MODE_TRUE_FALSE) {
        snprintf(prompt, sizeof(prompt),
            "Génère une question vrai/faux en français sur ce contenu. "
            "Niveau: %s. "
            "Format JSON: {\"question\": \"...\", \"topic\": \"...\", \"correct\": true/false, \"explanation\": \"...\"}\n\nContenu:\n%s",
            difficulty_str, content);
    } else {
        snprintf(prompt, sizeof(prompt),
            "Génère une question à réponse ouverte en français sur ce contenu. "
            "Niveau: %s. "
            "Format JSON: {\"question\": \"...\", \"topic\": \"...\", \"expected\": \"...\", \"criteria\": \"...\"}\n\nContenu:\n%s",
            difficulty_str, content);
    }

    free(content);

    char *response_json = NULL;
    err = gemini_generate(prompt, &response_json);
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

    cJSON *question_obj = cJSON_Parse(text_content);
    cJSON_Delete(root);

    if (!question_obj) {
        return SS_ERR_JSON_PARSE;
    }

    // Extraire les champs communs
    const char *question_text = json_get_string(question_obj, "question");
    const char *topic = json_get_string(question_obj, "topic");

    if (question_text) out->question_text = strdup(question_text);
    if (topic) out->topic = strdup(topic);

    // Extraire selon le mode
    if (session->config.mode == QUIZ_MODE_MULTIPLE_CHOICE) {
        cJSON *options_array = cJSON_GetObjectItem(question_obj, "options");
        if (options_array && cJSON_IsArray(options_array)) {
            for (int i = 0; i < 4 && i < cJSON_GetArraySize(options_array); i++) {
                const char *opt = cJSON_GetArrayItem(options_array, i)->valuestring;
                if (opt) out->options[i] = strdup(opt);
            }
        }
        out->correct_option = json_get_int(question_obj, "correct", 0);
        
        // Mélanger les options tout en gardant trace de la bonne réponse
        int indices[4] = {0, 1, 2, 3};
        shuffle_int_array(indices, 4);
        
        char *shuffled_options[4];
        int new_correct_index = 0;
        for (int i = 0; i < 4; i++) {
            shuffled_options[i] = out->options[indices[i]];
            if (indices[i] == out->correct_option) {
                new_correct_index = i;
            }
        }
        for (int i = 0; i < 4; i++) {
            out->options[i] = shuffled_options[i];
        }
        out->correct_option = new_correct_index;
        
    } else if (session->config.mode == QUIZ_MODE_TRUE_FALSE) {
        out->correct_bool = cJSON_IsTrue(cJSON_GetObjectItem(question_obj, "correct"));
        
    } else {
        const char *expected = json_get_string(question_obj, "expected");
        const char *criteria = json_get_string(question_obj, "criteria");
        if (expected) out->expected_answer = strdup(expected);
        if (criteria) out->evaluation_criteria = strdup(criteria);
    }

    // Extraire l'explication
    const char *explanation = json_get_string(question_obj, "explanation");
    if (explanation) {
        // Stocker dans evaluation_criteria pour OPEN_ENDED, ou ignorer pour autres modes
        if (session->config.mode == QUIZ_MODE_OPEN_ENDED && !out->evaluation_criteria) {
            out->evaluation_criteria = strdup(explanation);
        }
    }

    cJSON_Delete(question_obj);

    session->questions_generated++;
    LOG_INFO("Question générée: index=%d, mode=%s", question_index, mode_str);

    return SS_OK;
}

SSError quiz_submit_answer(int64_t session_id, int question_index, 
                           const char *answer, AnswerResult *out) {
    if (!answer || !out) {
        return SS_ERR_NULL_PTR;
    }

    memset(out, 0, sizeof(AnswerResult));
    out->answered_at = time(NULL);

    // Récupérer la question depuis la base
    // Note: nécessite fonction db_quiz_get_question
    // Pour l'instant, simulation

    QuizSession session;
    SSError err = quiz_get_session(session_id, &session);
    if (err != SS_OK) {
        return err;
    }

    Question question;
    err = quiz_generate_question(&session, question_index, &question);
    if (err != SS_OK) {
        quiz_session_free(&session);
        return err;
    }

    bool is_correct = false;

    if (session.config.mode == QUIZ_MODE_MULTIPLE_CHOICE) {
        int answer_int = atoi(answer);
        is_correct = (answer_int == question.correct_option);
        out->is_correct = is_correct;
        out->score = is_correct ? 1.0f : 0.0f;
        
    } else if (session.config.mode == QUIZ_MODE_TRUE_FALSE) {
        bool answer_bool = (strcmp(answer, "true") == 0 || strcmp(answer, "vrai") == 0);
        is_correct = (answer_bool == question.correct_bool);
        out->is_correct = is_correct;
        out->score = is_correct ? 1.0f : 0.0f;
        
    } else {
        // OPEN_ENDED: évaluation par IA
        char prompt[8192];
        snprintf(prompt, sizeof(prompt),
            "Évalue cette réponse sur une échelle de 0 à 1. "
            "Question: %s\n"
            "Réponse attendue: %s\n"
            "Réponse de l'étudiant: %s\n\n"
            "Format JSON: {\"score\": 0.8, \"feedback\": \"...\", \"explanation\": \"...\"}",
            question.question_text, question.expected_answer ? question.expected_answer : "N/A",
            answer);

        char *response_json = NULL;
        err = gemini_generate(prompt, &response_json);
        if (err != SS_OK) {
            question_free(&question);
            quiz_session_free(&session);
            return err;
        }

        cJSON *root = json_parse(response_json);
        free(response_json);

        if (root) {
            out->score = json_get_double(root, "score", 0.0f);
            const char *feedback = json_get_string(root, "feedback");
            const char *explanation = json_get_string(root, "explanation");
            
            if (feedback) out->feedback = strdup(feedback);
            if (explanation) out->explanation = strdup(explanation);
            
            out->is_correct = (out->score >= 0.5f);
            cJSON_Delete(root);
        }
    }

    // Sauvegarder la réponse en base
    // Note: nécessite table quiz_answers
    LOG_INFO("Réponse soumise: session=%lld, question=%d, correct=%d, score=%.2f",
             session_id, question_index, out->is_correct, out->score);

    question_free(&question);
    quiz_session_free(&session);

    return SS_OK;
}

SSError quiz_finish_session(int64_t session_id, QuizReport *out) {
    if (!out) {
        return SS_ERR_NULL_PTR;
    }

    memset(out, 0, sizeof(QuizReport));
    out->session_id = session_id;

    // Récupérer la session
    QuizSession session;
    SSError err = quiz_get_session(session_id, &session);
    if (err != SS_OK) {
        return err;
    }

    // Récupérer toutes les réponses depuis la base
    // Note: nécessite fonction db_quiz_get_all_answers
    // Pour l'instant, simulation
    
    int total_questions = session.questions_generated;
    int correct_count = 0;
    
    // Simuler des statistiques
    out->total_questions = total_questions;
    out->correct_count = correct_count;
    out->final_score = total_questions > 0 ? (float)correct_count / total_questions : 0.0f;
    out->time_taken_seconds = session.finished_at - session.started_at;

    // Analyse des lacunes via IA
    char prompt[8192];
    snprintf(prompt, sizeof(prompt),
        "Analyse les performances d'un étudiant sur un quiz. "
        "Score: %.2f (%d/%d correct). "
        "Identifie 3-5 sujets faibles et propose 3 recommandations d'étude. "
        "Format JSON: {\"weak_topics\": [\"...\"], \"recommendations\": [\"...\"]}",
        out->final_score, correct_count, total_questions);

    char *response_json = NULL;
    err = gemini_generate(prompt, &response_json);
    if (err == SS_OK) {
        cJSON *root = json_parse(response_json);
        free(response_json);

        if (root) {
            cJSON *weak_array = cJSON_GetObjectItem(root, "weak_topics");
            cJSON *rec_array = cJSON_GetObjectItem(root, "recommendations");

            if (weak_array && cJSON_IsArray(weak_array)) {
                int count = cJSON_GetArraySize(weak_array);
                out->weak_topic_count = count > MAX_WEAK_TOPICS ? MAX_WEAK_TOPICS : count;
                out->weak_topics = calloc(out->weak_topic_count, sizeof(char*));
                for (int i = 0; i < out->weak_topic_count; i++) {
                    const char *topic = cJSON_GetArrayItem(weak_array, i)->valuestring;
                    if (topic) out->weak_topics[i] = strdup(topic);
                }
            }

            if (rec_array && cJSON_IsArray(rec_array)) {
                int count = cJSON_GetArraySize(rec_array);
                out->recommendation_count = count > MAX_RECOMMENDATIONS ? MAX_RECOMMENDATIONS : count;
                out->recommendations = calloc(out->recommendation_count, sizeof(char*));
                for (int i = 0; i < out->recommendation_count; i++) {
                    const char *rec = cJSON_GetArrayItem(rec_array, i)->valuestring;
                    if (rec) out->recommendations[i] = strdup(rec);
                }
            }

            cJSON_Delete(root);
        }
    }

    session.finished_at = time(NULL);
    session.is_active = false;

    LOG_INFO("Session terminée: ID=%lld, score=%.2f, lacunes=%d", 
             session_id, out->final_score, out->weak_topic_count);

    quiz_session_free(&session);

    return SS_OK;
}

SSError quiz_adapt_difficulty(QuizSession *session) {
    if (!session || !session->config.adaptive) {
        return SS_OK; // Pas d'adaptation si désactivé
    }

    // Récupérer les 3 dernières réponses
    // Note: nécessite fonction db_quiz_get_recent_answers
    // Pour l'instant, simulation basée sur le score moyen

    // Si le score moyen des 3 dernières réponses > 0.8, augmenter la difficulté
    // Si < 0.4, diminuer la difficulté

    QuizDifficulty current = session->config.difficulty;
    QuizDifficulty new_difficulty = current;

    // Simulation: adapter selon l'index de question
    if (session->current_question_index > 5 && current == QUIZ_DIFFICULTY_EASY) {
        new_difficulty = QUIZ_DIFFICULTY_MEDIUM;
    } else if (session->current_question_index > 10 && current == QUIZ_DIFFICULTY_MEDIUM) {
        new_difficulty = QUIZ_DIFFICULTY_HARD;
    }

    if (new_difficulty != current) {
        session->config.difficulty = new_difficulty;
        LOG_INFO("Difficulté adaptée: %s -> %s", 
                 difficulty_to_string(current), difficulty_to_string(new_difficulty));
    }

    return SS_OK;
}

SSError quiz_get_session(int64_t session_id, QuizSession *out) {
    if (!out) {
        return SS_ERR_NULL_PTR;
    }

    memset(out, 0, sizeof(QuizSession));
    out->id = session_id;

    // Récupérer depuis la base
    // Note: nécessite fonction db_quiz_get_session
    // Pour l'instant, simulation
    
    out->user_id = 1;
    out->document_count = 1;
    out->document_ids = malloc(sizeof(int));
    out->document_ids[0] = 1;
    out->config.mode = QUIZ_MODE_MULTIPLE_CHOICE;
    out->config.difficulty = QUIZ_DIFFICULTY_MEDIUM;
    out->config.question_count = 10;
    out->config.adaptive = true;
    out->created_at = time(NULL) - 3600;
    out->started_at = time(NULL) - 3000;
    out->current_question_index = 5;
    out->questions_generated = 5;
    out->is_active = true;

    return SS_OK;
}

void question_free(Question *q) {
    if (!q) return;
    
    free(q->question_text);
    free(q->topic);
    
    for (int i = 0; i < 4; i++) {
        free(q->options[i]);
    }
    
    free(q->expected_answer);
    free(q->evaluation_criteria);
}

void answer_result_free(AnswerResult *r) {
    if (!r) return;
    
    free(r->feedback);
    free(r->explanation);
}

void quiz_report_free(QuizReport *report) {
    if (!report) return;
    
    if (report->weak_topics) {
        for (int i = 0; i < report->weak_topic_count; i++) {
            free(report->weak_topics[i]);
        }
        free(report->weak_topics);
    }
    
    if (report->recommendations) {
        for (int i = 0; i < report->recommendation_count; i++) {
            free(report->recommendations[i]);
        }
        free(report->recommendations);
    }
}

void quiz_session_free(QuizSession *session) {
    if (!session) return;
    
    free(session->document_ids);
}
