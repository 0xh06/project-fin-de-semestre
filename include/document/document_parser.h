/**
 * @file document_parser.h
 * @brief Extraction de texte et chunking pour documents (TXT/PDF).
 */

#ifndef SMARTSTUDY_DOCUMENT_DOCUMENT_PARSER_H
#define SMARTSTUDY_DOCUMENT_DOCUMENT_PARSER_H

#include "core/error.h"
#include <stddef.h>

/** Chunk de texte */
typedef struct {
    char  *text;        /**< Texte du chunk (alloué) */
    size_t char_count;  /**< Nombre de caractères */
    int    token_count; /**< Estimation du nombre de tokens (~4 chars/token) */
} TextChunk;

/** Résultat du parsing de document */
typedef struct {
    char       *full_text;      /**< Texte complet extrait (alloué) */
    TextChunk  *chunks;         /**< Tableau de chunks (alloué) */
    int         chunk_count;    /**< Nombre de chunks */
    size_t      total_chars;    /**< Nombre total de caractères */
    int         estimated_tokens; /**< Estimation totale de tokens */
} ParsedDocument;

/**
 * Extrait le texte d'un fichier (TXT ou PDF).
 * Pour PDF, tente pdftotext via popen, sinon mupdf si disponible.
 * @param filepath  Chemin vers le fichier.
 * @param out       Structure de sortie (à libérer avec parsed_document_free).
 * @return SS_OK ou code d'erreur.
 */
SSError parse_document(const char *filepath, ParsedDocument *out);

/**
 * Libère la mémoire d'un ParsedDocument.
 * @param doc  Document à libérer.
 */
void parsed_document_free(ParsedDocument *doc);

/**
 * Libère un tableau de TextChunk.
 * @param chunks    Tableau de chunks.
 * @param count     Nombre de chunks.
 */
void text_chunks_free(TextChunk *chunks, int count);

#endif /* SMARTSTUDY_DOCUMENT_DOCUMENT_PARSER_H */
