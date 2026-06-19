/**
 * @file mindmap.h
 * @brief Génération et manipulation de mind-maps.
 *
 * Crée des cartes mentales structurées à partir
 * de texte documentaire via l'IA.
 */

#ifndef SMARTSTUDY_MINDMAP_MINDMAP_H
#define SMARTSTUDY_MINDMAP_MINDMAP_H

#include "core/error.h"
#include <stdint.h>

/** Nœud de mind-map */
typedef struct {
    int     id;
    char   *label;
    char   *color;
    int     parent_id;
} MindMapNode;

/** Relation entre nœuds */
typedef struct {
    int     from_id;
    int     to_id;
    char   *relation_label;
} MindMapEdge;

/** Mind-map complète */
typedef struct {
    int            id;
    char          *title;
    MindMapNode   *nodes;
    int            node_count;
    MindMapEdge   *edges;
    int            edge_count;
} MindMap;

/**
 * Génère une mind-map via l'IA à partir d'un document.
 * @param document_id  ID du document source
 * @param user_id      ID de l'utilisateur
 * @param out          Mind-map générée (à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError mindmap_generate(int64_t document_id, int64_t user_id, MindMap *out);

/**
 * Sérialise une mind-map en JSON pour le frontend.
 * @param map       Mind-map à sérialiser
 * @param json_out  Chaîne JSON (allouée, à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError mindmap_to_json(MindMap *map, char **json_out);

/**
 * Sauvegarde une mind-map dans SQLite.
 * @param map  Mind-map à sauvegarder
 * @return SS_OK ou code d'erreur
 */
SSError mindmap_save(MindMap *map);

/**
 * Charge une mind-map depuis SQLite.
 * @param mindmap_id  ID de la mind-map
 * @param out        Mind-map chargée (à libérer)
 * @return SS_OK ou code d'erreur
 */
SSError mindmap_load(int64_t mindmap_id, MindMap *out);

/**
 * Libère la mémoire d'une mind-map.
 * @param map  Mind-map à libérer
 */
void mindmap_free(MindMap *map);

#endif /* SMARTSTUDY_MINDMAP_MINDMAP_H */
