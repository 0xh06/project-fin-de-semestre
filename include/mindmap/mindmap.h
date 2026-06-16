/**
 * @file mindmap.h
 * @brief Génération et manipulation de mind-maps.
 *
 * Crée des cartes mentales structurées (arborescences JSON) à partir
 * de texte documentaire via l'IA, et permet l'édition manuelle.
 */

#ifndef SMARTSTUDY_MINDMAP_MINDMAP_H
#define SMARTSTUDY_MINDMAP_MINDMAP_H

#include <sqlite3.h>
#include "core/error.h"
#include "db/models.h"

/**
 * Nœud d'une mind-map (structure récursive).
 */
typedef struct MindMapNode {
    char                 *label;       /**< Texte du nœud */
    struct MindMapNode  **children;    /**< Tableau de pointeurs vers les enfants */
    int                   child_count; /**< Nombre d'enfants */
} MindMapNode;

/**
 * Génère une mind-map via l'IA à partir du texte d'un document.
 * @param db           Handle SQLite.
 * @param user_id      ID de l'utilisateur.
 * @param document_id  ID du document source.
 * @param source_text  Texte source.
 * @param mindmap_id   Pointeur de sortie pour l'ID de la mind-map créée.
 * @return SS_OK ou code d'erreur.
 */
SSError mindmap_generate(sqlite3 *db,
                         int64_t user_id,
                         int64_t document_id,
                         const char *source_text,
                         int64_t *mindmap_id);

/**
 * Charge une mind-map depuis la base et la parse en arbre.
 * @param db          Handle SQLite.
 * @param mindmap_id  ID de la mind-map.
 * @param root        Pointeur de sortie vers le nœud racine.
 * @return SS_OK ou code d'erreur.
 */
SSError mindmap_load(sqlite3 *db, int64_t mindmap_id, MindMapNode **root);

/**
 * Sérialise un arbre de mind-map en JSON.
 * @param root  Nœud racine.
 * @return Chaîne JSON (allouée, à free par l'appelant).
 */
char *mindmap_to_json(const MindMapNode *root);

/**
 * Libère récursivement un arbre de mind-map.
 * @param node  Nœud racine à libérer.
 */
void mindmap_node_free(MindMapNode *node);

#endif /* SMARTSTUDY_MINDMAP_MINDMAP_H */
