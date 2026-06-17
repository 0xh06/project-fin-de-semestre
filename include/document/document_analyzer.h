/**
 * @file document_analyzer.h
 * @brief Analyse de documents avec IA et stockage SQLite.
 */

#ifndef SMARTSTUDY_DOCUMENT_DOCUMENT_ANALYZER_H
#define SMARTSTUDY_DOCUMENT_DOCUMENT_ANALYZER_H

#include "core/error.h"
#include "db/models.h"

/** Flashcard générée par IA */
typedef struct {
    char *question;
    char *answer;
} GeneratedFlashcard;

/** Concept clé identifié */
typedef struct {
    char *name;
    char *description;
} KeyConcept;

/** Noeud de mind map */
typedef struct {
    char *id;
    char *label;
    char *parent_id;
} MindMapNode;

/** Résultat complet de l'analyse */
typedef struct {
    char                 *summary;              /**< Résumé final (alloué) */
    GeneratedFlashcard   *flashcards;           /**< 10 flashcards (alloué) */
    int                   flashcard_count;
    KeyConcept           *key_concepts;         /**< 5 concepts clés (alloué) */
    int                   concept_count;
    MindMapNode          *mindmap_nodes;        /**< Noeuds mind map (alloué) */
    int                   mindmap_node_count;
    char                 *mindmap_json;         /**< Mind map en JSON (alloué) */
    int64_t               document_id;           /**< ID du document en base */
} DocumentAnalysis;

/**
 * Analyse un document complet.
 * @param filepath  Chemin vers le fichier à analyser.
 * @param user_id   ID de l'utilisateur propriétaire.
 * @param out       Structure de résultat (à libérer avec document_analysis_free).
 * @return SS_OK ou code d'erreur.
 */
SSError analyze_document(const char *filepath, int64_t user_id, DocumentAnalysis *out);

/**
 * Libère la mémoire d'un DocumentAnalysis.
 * @param analysis  Analyse à libérer.
 */
void document_analysis_free(DocumentAnalysis *analysis);

#endif /* SMARTSTUDY_DOCUMENT_DOCUMENT_ANALYZER_H */
