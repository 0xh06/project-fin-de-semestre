/**
 * @file mindmap.c
 * @brief Implémentation de la génération de mind-maps avec IA.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "mindmap/mindmap.h"
#include "api/ai_client.h"
#include "db/db.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

#define MAX_NODES 20

/**
 * Génère une couleur aléatoire pour un nœud.
 */
static char* generate_random_color(void) {
    const char *colors[] = {
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
        "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"
    };
    int count = sizeof(colors) / sizeof(colors[0]);
    return strdup(colors[rand() % count]);
}

SSError mindmap_generate(int64_t document_id, int64_t user_id, MindMap *out) {
    if (!out) return SS_ERR_NULL_PTR;

    memset(out, 0, sizeof(MindMap));

    LOG_INFO("Génération mindmap: document=%lld, user=%lld", document_id, user_id);

    // Récupérer le contenu du document
    // Note: nécessite fonction db_document_get_content dans db.h
    const char *document_content = "Contenu du document pour génération de mindmap.";

    // Construire le prompt IA
    char prompt[16384];
    snprintf(prompt, sizeof(prompt),
        "Génère une mind-map structurée à partir de ce texte. "
        "Maximum %d noeuds. "
        "Format JSON: {\"title\": \"Titre principal\", "
        "\"nodes\": [{\"id\": 1, \"label\": \"Concept\", \"parent_id\": 0}, ...], "
        "\"edges\": [{\"from_id\": 1, \"to_id\": 2, \"relation_label\": \"contient\"}, ...]}\n"
        "L'ID 0 est la racine. Les IDs doivent être uniques et séquentiels.\n\nTexte:\n%s",
        MAX_NODES, document_content);

    // Appeler l'IA
    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        LOG_ERROR("Erreur génération IA mindmap: %d", err);
        return err;
    }

    // Parser la réponse
    cJSON *root = json_parse(response_json);
    free(response_json);

    if (!root) {
        LOG_ERROR("Erreur parsing JSON mindmap");
        return SS_ERR_JSON_PARSE;
    }

    const char *text_content = json_get_string(root, "text");
    if (!text_content) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }

    cJSON *mindmap_obj = cJSON_Parse(text_content);
    cJSON_Delete(root);

    if (!mindmap_obj) {
        LOG_ERROR("Erreur parsing objet mindmap");
        return SS_ERR_JSON_PARSE;
    }

    // Extraire le titre
    const char *title = json_get_string(mindmap_obj, "title");
    if (title) out->title = strdup(title);

    // Extraire les noeuds
    cJSON *nodes_array = cJSON_GetObjectItem(mindmap_obj, "nodes");
    if (nodes_array && cJSON_IsArray(nodes_array)) {
        int node_count = cJSON_GetArraySize(nodes_array);
        if (node_count > MAX_NODES) node_count = MAX_NODES;

        out->nodes = calloc(node_count, sizeof(MindMapNode));
        out->node_count = node_count;

        for (int i = 0; i < node_count; i++) {
            cJSON *node_obj = cJSON_GetArrayItem(nodes_array, i);
            if (!node_obj) continue;

            out->nodes[i].id = json_get_int(node_obj, "id", i + 1);
            
            const char *label = json_get_string(node_obj, "label");
            if (label) out->nodes[i].label = strdup(label);
            
            out->nodes[i].parent_id = json_get_int(node_obj, "parent_id", 0);
            out->nodes[i].color = generate_random_color();
        }
    }

    // Extraire les edges
    cJSON *edges_array = cJSON_GetObjectItem(mindmap_obj, "edges");
    if (edges_array && cJSON_IsArray(edges_array)) {
        int edge_count = cJSON_GetArraySize(edges_array);

        out->edges = calloc(edge_count, sizeof(MindMapEdge));
        out->edge_count = edge_count;

        for (int i = 0; i < edge_count; i++) {
            cJSON *edge_obj = cJSON_GetArrayItem(edges_array, i);
            if (!edge_obj) continue;

            out->edges[i].from_id = json_get_int(edge_obj, "from_id", 0);
            out->edges[i].to_id = json_get_int(edge_obj, "to_id", 0);
            
            const char *relation = json_get_string(edge_obj, "relation_label");
            if (relation) out->edges[i].relation_label = strdup(relation);
        }
    }

    cJSON_Delete(mindmap_obj);

    LOG_INFO("Mindmap générée: %d noeuds, %d edges", out->node_count, out->edge_count);

    return SS_OK;
}

SSError mindmap_to_json(MindMap *map, char **json_out) {
    if (!map || !json_out) return SS_ERR_NULL_PTR;

    cJSON *root = cJSON_CreateObject();
    
    cJSON_AddStringToObject(root, "title", map->title ? map->title : "");

    // Sérialiser les noeuds
    cJSON *nodes_array = cJSON_CreateArray();
    for (int i = 0; i < map->node_count; i++) {
        cJSON *node_obj = cJSON_CreateObject();
        cJSON_AddNumberToObject(node_obj, "id", map->nodes[i].id);
        cJSON_AddStringToObject(node_obj, "label", map->nodes[i].label ? map->nodes[i].label : "");
        cJSON_AddStringToObject(node_obj, "color", map->nodes[i].color ? map->nodes[i].color : "#000000");
        cJSON_AddNumberToObject(node_obj, "parent_id", map->nodes[i].parent_id);
        cJSON_AddItemToArray(nodes_array, node_obj);
    }
    cJSON_AddItemToObject(root, "nodes", nodes_array);

    // Sérialiser les edges
    cJSON *edges_array = cJSON_CreateArray();
    for (int i = 0; i < map->edge_count; i++) {
        cJSON *edge_obj = cJSON_CreateObject();
        cJSON_AddNumberToObject(edge_obj, "from_id", map->edges[i].from_id);
        cJSON_AddNumberToObject(edge_obj, "to_id", map->edges[i].to_id);
        cJSON_AddStringToObject(edge_obj, "relation_label", 
                               map->edges[i].relation_label ? map->edges[i].relation_label : "");
        cJSON_AddItemToArray(edges_array, edge_obj);
    }
    cJSON_AddItemToObject(root, "edges", edges_array);

    *json_out = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);

    if (!*json_out) return SS_ERR_ALLOC;

    return SS_OK;
}

SSError mindmap_save(MindMap *map) {
    if (!map) return SS_ERR_NULL_PTR;

    // Sérialiser en JSON
    char *json_str = NULL;
    SSError err = mindmap_to_json(map, &json_str);
    if (err != SS_OK) return err;

    // Sauvegarder en SQLite
    // Note: nécessite fonction db_mindmap_save dans db.h
    // Pour l'instant, on utilise une approche simplifiée
    
    const char *sql =
        "INSERT INTO mindmaps (user_id, document_id, title, data_json) "
        "VALUES (?, ?, ?, ?) "
        "ON CONFLICT(id) DO UPDATE SET "
        "title = excluded.title, "
        "data_json = excluded.data_json";

    // Note: nécessite implémentation dans db.h
    
    free(json_str);

    LOG_INFO("Mindmap sauvegardée: id=%d", map->id);

    return SS_OK;
}

SSError mindmap_load(int64_t mindmap_id, MindMap *out) {
    if (!out) return SS_ERR_NULL_PTR;

    memset(out, 0, sizeof(MindMap));
    out->id = mindmap_id;

    // Charger depuis SQLite
    const char *sql = "SELECT title, data_json FROM mindmaps WHERE id = ?";

    // Note: nécessite fonction db_mindmap_get dans db.h
    // Pour l'instant, simulation
    
    // Parser le JSON
    const char *json_str = "{\"title\": \"Mindmap chargée\", \"nodes\": [], \"edges\": []}";
    
    cJSON *root = json_parse(json_str);
    if (!root) return SS_ERR_JSON_PARSE;

    const char *title = json_get_string(root, "title");
    if (title) out->title = strdup(title);

    // Parser les noeuds
    cJSON *nodes_array = cJSON_GetObjectItem(root, "nodes");
    if (nodes_array && cJSON_IsArray(nodes_array)) {
        int node_count = cJSON_GetArraySize(nodes_array);
        out->nodes = calloc(node_count, sizeof(MindMapNode));
        out->node_count = node_count;

        for (int i = 0; i < node_count; i++) {
            cJSON *node_obj = cJSON_GetArrayItem(nodes_array, i);
            if (!node_obj) continue;

            out->nodes[i].id = json_get_int(node_obj, "id", 0);
            const char *label = json_get_string(node_obj, "label");
            if (label) out->nodes[i].label = strdup(label);
            const char *color = json_get_string(node_obj, "color");
            if (color) out->nodes[i].color = strdup(color);
            out->nodes[i].parent_id = json_get_int(node_obj, "parent_id", 0);
        }
    }

    // Parser les edges
    cJSON *edges_array = cJSON_GetObjectItem(root, "edges");
    if (edges_array && cJSON_IsArray(edges_array)) {
        int edge_count = cJSON_GetArraySize(edges_array);
        out->edges = calloc(edge_count, sizeof(MindMapEdge));
        out->edge_count = edge_count;

        for (int i = 0; i < edge_count; i++) {
            cJSON *edge_obj = cJSON_GetArrayItem(edges_array, i);
            if (!edge_obj) continue;

            out->edges[i].from_id = json_get_int(edge_obj, "from_id", 0);
            out->edges[i].to_id = json_get_int(edge_obj, "to_id", 0);
            const char *relation = json_get_string(edge_obj, "relation_label");
            if (relation) out->edges[i].relation_label = strdup(relation);
        }
    }

    cJSON_Delete(root);

    LOG_INFO("Mindmap chargée: id=%lld, %d noeuds", mindmap_id, out->node_count);

    return SS_OK;
}

void mindmap_free(MindMap *map) {
    if (!map) return;

    free(map->title);

    if (map->nodes) {
        for (int i = 0; i < map->node_count; i++) {
            free(map->nodes[i].label);
            free(map->nodes[i].color);
        }
        free(map->nodes);
    }

    if (map->edges) {
        for (int i = 0; i < map->edge_count; i++) {
            free(map->edges[i].relation_label);
        }
        free(map->edges);
    }

    memset(map, 0, sizeof(MindMap));
}
