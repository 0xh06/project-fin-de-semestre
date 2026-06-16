/**
 * @file mindmap.c
 * @brief Implémentation de la génération de mind-maps.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sqlite3.h>
#include "mindmap/mindmap.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

SSError mindmap_generate(sqlite3 *db,
                         int64_t user_id,
                         int64_t document_id,
                         const char *source_text,
                         int64_t *mindmap_id) {
    if (!db || !source_text || !mindmap_id) return SS_ERR_NULL_PTR;

    /* TODO: Appeler l'IA pour générer une structure arborescente JSON
     * à partir du texte source.
     *
     * Prompt suggéré :
     * "Génère une mind-map au format JSON à partir du texte suivant.
     *  Format : {\"label\": \"...\", \"children\": [...]}"
     */

    /* Placeholder : mind-map vide */
    const char *default_json = "{\"label\": \"Racine\", \"children\": []}";

    const char *sql =
        "INSERT INTO mindmaps (user_id, document_id, title, data_json) "
        "VALUES (?, ?, 'Mind-map auto-générée', ?);";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, user_id);
    sqlite3_bind_int64(stmt, 2, document_id);
    sqlite3_bind_text(stmt, 3, default_json, -1, SQLITE_STATIC);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) return SS_ERR_DB_QUERY;

    *mindmap_id = sqlite3_last_insert_rowid(db);
    LOG_INFO("Mind-map créée : id=%lld", (long long)*mindmap_id);
    return SS_OK;
}

SSError mindmap_load(sqlite3 *db, int64_t mindmap_id, MindMapNode **root) {
    if (!db || !root) return SS_ERR_NULL_PTR;

    const char *sql = "SELECT data_json FROM mindmaps WHERE id = ?;";

    sqlite3_stmt *stmt;
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) return SS_ERR_DB_QUERY;

    sqlite3_bind_int64(stmt, 1, mindmap_id);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return SS_ERR_DB_QUERY;
    }

    const char *json_str = (const char *)sqlite3_column_text(stmt, 0);

    /* Parser le JSON en arbre de MindMapNode */
    cJSON *json = json_parse(json_str);
    sqlite3_finalize(stmt);

    if (!json) return SS_ERR_JSON_PARSE;

    /* Construire récursivement l'arbre */
    *root = calloc(1, sizeof(MindMapNode));
    if (!*root) {
        cJSON_Delete(json);
        return SS_ERR_ALLOC;
    }

    const char *label = json_get_string(json, "label");
    (*root)->label = strdup(label ? label : "?");

    cJSON *children = cJSON_GetObjectItem(json, "children");
    if (cJSON_IsArray(children)) {
        int n = cJSON_GetArraySize(children);
        (*root)->children = calloc(n, sizeof(MindMapNode *));
        (*root)->child_count = n;

        /* TODO: Parsing récursif des enfants */
    }

    cJSON_Delete(json);
    return SS_OK;
}

char *mindmap_to_json(const MindMapNode *root) {
    if (!root) return strdup("{}");

    cJSON *obj = cJSON_CreateObject();
    cJSON_AddStringToObject(obj, "label", root->label ? root->label : "");

    cJSON *children_arr = cJSON_CreateArray();
    for (int i = 0; i < root->child_count; i++) {
        if (root->children[i]) {
            char *child_json = mindmap_to_json(root->children[i]);
            cJSON *child_obj = cJSON_Parse(child_json);
            cJSON_AddItemToArray(children_arr, child_obj);
            free(child_json);
        }
    }
    cJSON_AddItemToObject(obj, "children", children_arr);

    char *result = cJSON_PrintUnformatted(obj);
    cJSON_Delete(obj);
    return result;
}

void mindmap_node_free(MindMapNode *node) {
    if (!node) return;

    free(node->label);
    for (int i = 0; i < node->child_count; i++) {
        mindmap_node_free(node->children[i]);
    }
    free(node->children);
    free(node);
}
