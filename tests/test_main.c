/**
 * @file test_main.c
 * @brief Point d'entrée du runner de tests unitaires.
 *
 * Appelle tous les groupes de tests via Unity.
 */

#include <string.h>
#include "unity.h"

/* --- Déclarations externes des tests de chaque module --- */

/* core/ */
extern void test_error_str_returns_valid_strings(void);
extern void test_config_load_and_get(void);

/* db/ */
extern void test_db_open_close(void);
extern void test_db_migrate(void);

/* api/ */
extern void test_rest_client_init_cleanup(void);

/* pdf/ */
extern void test_pdf_invalid_path(void);
extern void test_pdf_non_pdf_file(void);

/* chat/ */
extern void test_chat_provider_from_string(void);

/* review/ */
extern void test_flashcard_create_deck(void);
extern void test_sm2_quality_perfect(void);
extern void test_sm2_quality_blackout(void);
extern void test_sm2_easiness_never_below_1_3(void);
extern void test_quiz_create(void);

/* progress/ */
extern void test_tracker_start_end_session(void);

/* mindmap/ */
extern void test_mindmap_to_json(void);

/* utils/ */
extern void test_json_parse_valid(void);
extern void test_json_parse_invalid(void);
extern void test_json_get_string(void);
extern void test_json_build_gemini_payload(void);
extern void test_str_dup(void);
extern void test_str_trim(void);
extern void test_str_is_empty(void);
extern void test_str_concat(void);
extern void test_str_truncate(void);

/* --- Setup / Teardown globaux (requis par Unity) --- */
void setUp(void)    { /* rien */ }
void tearDown(void) { /* rien */ }

/* --- Runner principal --- */
int main(void) {
    UnityBegin("SmartStudy AI — Tests unitaires");

    /* === core === */
    RUN_TEST(test_error_str_returns_valid_strings);
    RUN_TEST(test_config_load_and_get);

    /* === db === */
    RUN_TEST(test_db_open_close);
    RUN_TEST(test_db_migrate);

    /* === api === */
    RUN_TEST(test_rest_client_init_cleanup);

    /* === pdf === */
    RUN_TEST(test_pdf_invalid_path);
    RUN_TEST(test_pdf_non_pdf_file);

    /* === chat === */
    RUN_TEST(test_chat_provider_from_string);

    /* === review === */
    RUN_TEST(test_flashcard_create_deck);
    RUN_TEST(test_sm2_quality_perfect);
    RUN_TEST(test_sm2_quality_blackout);
    RUN_TEST(test_sm2_easiness_never_below_1_3);
    RUN_TEST(test_quiz_create);

    /* === progress === */
    RUN_TEST(test_tracker_start_end_session);

    /* === mindmap === */
    RUN_TEST(test_mindmap_to_json);

    /* === utils === */
    RUN_TEST(test_json_parse_valid);
    RUN_TEST(test_json_parse_invalid);
    RUN_TEST(test_json_get_string);
    RUN_TEST(test_json_build_gemini_payload);
    RUN_TEST(test_str_dup);
    RUN_TEST(test_str_trim);
    RUN_TEST(test_str_is_empty);
    RUN_TEST(test_str_concat);
    RUN_TEST(test_str_truncate);

    return UnityEnd();
}
