/**
 * @file test_mindmap.c
 * @brief Tests unitaires pour le module mindmap/mindmap.
 */

#include <stdlib.h>
#include <string.h>
#include "unity.h"
#include "mindmap/mindmap.h"

void test_mindmap_to_json(void) {
    /* Créer un arbre simple */
    MindMapNode *root = calloc(1, sizeof(MindMapNode));
    TEST_ASSERT_NOT_NULL(root);
    root->label = strdup("Racine");

    /* Ajouter 2 enfants */
    root->child_count = 2;
    root->children = calloc(2, sizeof(MindMapNode *));

    root->children[0] = calloc(1, sizeof(MindMapNode));
    root->children[0]->label = strdup("Enfant A");
    root->children[0]->child_count = 0;
    root->children[0]->children = NULL;

    root->children[1] = calloc(1, sizeof(MindMapNode));
    root->children[1]->label = strdup("Enfant B");
    root->children[1]->child_count = 0;
    root->children[1]->children = NULL;

    /* Sérialiser */
    char *json = mindmap_to_json(root);
    TEST_ASSERT_NOT_NULL(json);

    /* Vérifications basiques sur le JSON */
    TEST_ASSERT_NOT_NULL(strstr(json, "Racine"));
    TEST_ASSERT_NOT_NULL(strstr(json, "Enfant A"));
    TEST_ASSERT_NOT_NULL(strstr(json, "Enfant B"));
    TEST_ASSERT_NOT_NULL(strstr(json, "children"));

    free(json);
    mindmap_node_free(root);
}
