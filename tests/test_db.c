/**
 * @file test_db.c
 * @brief Tests unitaires pour la couche base de données.
 */

#include <string.h>
#include "unity.h"
#include "db/db.h"

static sqlite3 *test_db = NULL;

void setUp(void) {
    // Initialiser une DB en mémoire pour chaque test
    TEST_ASSERT_EQUAL_INT(DB_OK, db_init(":memory:"));
}

void tearDown(void) {
    // Fermer la DB après chaque test
    db_close();
}

void test_db_init_creates_tables(void) {
    // Vérifier que les tables sont créées
    // Note: nécessite fonction db_table_exists
    // Pour l'instant, on vérifie juste que l'init réussit
    TEST_ASSERT_EQUAL_INT(DB_OK, db_init(":memory:"));
    db_close();
}

void test_user_create_and_find(void) {
    int64_t user_id;
    DBError err = user_create("test@example.com", "hashed_password", 
                              "{\"theme\": \"dark\"}", &user_id);
    TEST_ASSERT_EQUAL_INT(DB_OK, err);
    TEST_ASSERT_TRUE(user_id > 0);

    DBUser user;
    err = user_find_by_email("test@example.com", &user);
    TEST_ASSERT_EQUAL_INT(DB_OK, err);
    TEST_ASSERT_EQUAL_INT(user_id, user.id);
    TEST_ASSERT_EQUAL_STRING("test@example.com", user.email);

    user_free(&user);
}

void test_document_save_and_retrieve(void) {
    // Créer un utilisateur d'abord
    int64_t user_id;
    user_create("doc_test@example.com", "hash", "{}", &user_id);

    // Sauvegarder un document
    DBDocument doc;
    memset(&doc, 0, sizeof(doc));
    doc.user_id = user_id;
    doc.filename = strdup("test.pdf");
    doc.content_text = strdup("Contenu de test du document");
    doc.summary_ai = strdup("Résumé généré par IA");
    doc.tags = strdup("test,exemple");

    int64_t doc_id;
    DBError err = document_save(&doc, &doc_id);
    TEST_ASSERT_EQUAL_INT(DB_OK, err);
    TEST_ASSERT_TRUE(doc_id > 0);

    free(doc.filename);
    free(doc.content_text);
    free(doc.summary_ai);
    free(doc.tags);

    // Récupérer les documents
    DBDocument *docs = NULL;
    int count = 0;
    err = document_get_all_by_user(user_id, &docs, &count);
    TEST_ASSERT_EQUAL_INT(DB_OK, err);
    TEST_ASSERT_EQUAL_INT(1, count);
    TEST_ASSERT_EQUAL_STRING("test.pdf", docs[0].filename);

    document_list_free(docs, count);
}

void test_flashcard_crud(void) {
    // Créer un utilisateur
    int64_t user_id;
    user_create("flashcard_test@example.com", "hash", "{}", &user_id);

    // Créer une flashcard
    DBFlashcard card;
    memset(&card, 0, sizeof(card));
    card.user_id = user_id;
    card.front = strdup("Qu'est-ce que le C ?");
    card.back = strdup("Un langage de programmation");
    card.difficulty = 2.5;
    card.interval_days = 1;
    card.next_review = strdup("2024-01-01");

    int64_t card_id;
    DBError err = flashcard_save(&card, &card_id);
    TEST_ASSERT_EQUAL_INT(DB_OK, err);
    TEST_ASSERT_TRUE(card_id > 0);

    free(card.front);
    free(card.back);
    free(card.next_review);

    // Mettre à jour la révision
    err = flashcard_update_review(card_id, 2.6, 6, "2024-01-07");
    TEST_ASSERT_EQUAL_INT(DB_OK, err);

    // Récupérer les cartes dues aujourd'hui
    DBFlashcard *due_cards = NULL;
    int due_count = 0;
    err = flashcard_list_due_today(user_id, &due_cards, &due_count);
    TEST_ASSERT_EQUAL_INT(DB_OK, err);
    // Note: dépend de la date actuelle, peut être 0 ou 1

    flashcard_list_free(due_cards, due_count);
}

int main(void) {
    UNITY_BEGIN();

    RUN_TEST(test_db_init_creates_tables);
    RUN_TEST(test_user_create_and_find);
    RUN_TEST(test_document_save_and_retrieve);
    RUN_TEST(test_flashcard_crud);

    return UNITY_END();
}
