/**
 * @file quiz_engine.h
 * @brief Moteur de quiz adaptatif avec génération IA.
 */

#ifndef SMARTSTUDY_QUIZ_QUIZ_ENGINE_H
#define SMARTSTUDY_QUIZ_QUIZ_ENGINE_H

#include "core/error.h"
#include <stdint.h>
#include <time.h>

/** Modes de quiz */
typedef enum {
    QUIZ_MODE_MULTIPLE_CHOICE = 0,
    QUIZ_MODE_TRUE_FALSE = 1,
    QUIZ_MODE_OPEN_ENDED = 2
} QuizMode;

/** Niveaux de difficulté */
typedef enum {
    QUIZ_DIFFICULTY_AUTO = 0,
    QUIZ_DIFFICULTY_EASY = 1,
    QUIZ_DIFFICULTY_MEDIUM = 2,
    QUIZ_DIFFICULTY_HARD = 3
} QuizDifficulty;

/** Configuration de quiz */
typedef struct {
    QuizMode       mode;
    QuizDifficulty difficulty;
    int            question_count;
    int            time_limit_seconds;  /**< 0 = pas de limite */
    bool           adaptive;            /**< Active l'adaptation de difficulté */
} QuizConfig;

/** Session de quiz */
typedef struct {
    int64_t        id;
    int64_t        user_id;
    int           *document_ids;       /**< IDs des documents source */
    int            document_count;
    QuizConfig     config;
    time_t         created_at;
    time_t         started_at;
    time_t         finished_at;
    int            current_question_index;
    int            questions_generated;
    bool           is_active;
} QuizSession;

/** Question de quiz */
typedef struct {
    int64_t        id;
    int64_t        session_id;
    int            question_index;
    char          *question_text;
    char          *topic;               /**< Sujet/thème détecté */
    QuizMode       mode;
    QuizDifficulty difficulty;
    
    /* Pour MULTIPLE_CHOICE */
    char          *options[4];         /**< 4 options de réponse */
    int            correct_option;     /**< Index de la bonne réponse (0-3) */
    
    /* Pour TRUE_FALSE */
    bool           correct_bool;        /**< Vrai ou Faux */
    
    /* Pour OPEN_ENDED */
    char          *expected_answer;    /**< Réponse attendue (référence) */
    char          *evaluation_criteria; /**< Critères d'évaluation */
    
    time_t         generated_at;
} Question;

/** Résultat d'une réponse */
typedef struct {
    bool           is_correct;
    float          score;               /**< 0.0 - 1.0 */
    char          *feedback;            /**< Feedback IA (alloué) */
    char          *explanation;         /**< Explication détaillée (alloué) */
    time_t         answered_at;
    int            time_taken_seconds;
} AnswerResult;

/** Rapport final de quiz */
typedef struct {
    int64_t        session_id;
    float          final_score;         /**< 0.0 - 1.0 */
    int            correct_count;
    int            total_questions;
    int            time_taken_seconds;
    
    /* Analyse des lacunes */
    char         **weak_topics;         /**< Sujets faibles détectés */
    int            weak_topic_count;
    
    /* Recommandations */
    char         **recommendations;     /**< Suggestions d'étude */
    int            recommendation_count;
    
    /* Statistiques par difficulté */
    int            easy_correct;
    int            easy_total;
    int            medium_correct;
    int            medium_total;
    int            hard_correct;
    int            hard_total;
} QuizReport;

/**
 * Crée une nouvelle session de quiz.
 * @param user_id        ID de l'utilisateur
 * @param document_ids   Tableau d'IDs de documents source
 * @param doc_count      Nombre de documents
 * @param config         Configuration du quiz
 * @param session_id_out ID de la session créée
 * @return SS_OK ou code d'erreur
 */
SSError quiz_create_session(int64_t user_id, int *document_ids, int doc_count,
                            QuizConfig config, int64_t *session_id_out);

/**
 * Génère une question via IA pour une session.
 * @param session         Session de quiz
 * @param question_index Index de la question
 * @param out             Structure de question générée (à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError quiz_generate_question(QuizSession *session, int question_index, Question *out);

/**
 * Soumet une réponse et l'évalue.
 * @param session_id      ID de la session
 * @param question_index  Index de la question
 * @param answer          Réponse de l'utilisateur
 * @param out             Résultat de l'évaluation (à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError quiz_submit_answer(int64_t session_id, int question_index, 
                           const char *answer, AnswerResult *out);

/**
 * Termine une session et génère le rapport.
 * @param session_id  ID de la session
 * @param out         Rapport final (à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError quiz_finish_session(int64_t session_id, QuizReport *out);

/**
 * Ajuste la difficulté du quiz de manière adaptative.
 * @param session  Session de quiz
 * @return SS_OK ou code d'erreur
 */
SSError quiz_adapt_difficulty(QuizSession *session);

/**
 * Récupère une session de quiz depuis la base.
 * @param session_id  ID de la session
 * @param out         Structure de session (à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError quiz_get_session(int64_t session_id, QuizSession *out);

/**
 * Libère la mémoire d'une Question.
 * @param q  Question à libérer
 */
void question_free(Question *q);

/**
 * Libère la mémoire d'un AnswerResult.
 * @param r  Résultat à libérer
 */
void answer_result_free(AnswerResult *r);

/**
 * Libère la mémoire d'un QuizReport.
 * @param report  Rapport à libérer
 */
void quiz_report_free(QuizReport *report);

/**
 * Libère la mémoire d'une QuizSession.
 * @param session  Session à libérer
 */
void quiz_session_free(QuizSession *session);

#endif /* SMARTSTUDY_QUIZ_QUIZ_ENGINE_H */
