/**
 * @file pdf_parser.h
 * @brief Extraction de texte depuis des fichiers PDF.
 *
 * Utilise libpoppler (via poppler-glib) pour extraire le contenu textuel
 * page par page, et calcule des métadonnées (nb pages, taille).
 */

#ifndef SMARTSTUDY_PDF_PDF_PARSER_H
#define SMARTSTUDY_PDF_PDF_PARSER_H

#include "core/error.h"

/** Résultat de l'extraction d'un PDF */
typedef struct {
    char  *text;        /**< Texte extrait (concaténation de toutes les pages) */
    int    page_count;  /**< Nombre de pages */
    size_t text_length; /**< Longueur du texte extrait en octets */
} PdfContent;

/**
 * Extrait le texte d'un fichier PDF.
 * @param file_path  Chemin vers le fichier PDF.
 * @param content    Pointeur de sortie.
 * @return SS_OK, SS_ERR_PDF_OPEN ou SS_ERR_PDF_PARSE.
 */
SSError pdf_extract_text(const char *file_path, PdfContent *content);

/**
 * Libère la mémoire d'un PdfContent.
 * @param content  Contenu à libérer.
 */
void pdf_content_free(PdfContent *content);

#endif /* SMARTSTUDY_PDF_PDF_PARSER_H */
