/**
 * @file pdf_parser.c
 * @brief Implémentation de l'extraction de texte PDF.
 *
 * Utilise une lecture binaire basique du fichier.
 * Pour une extraction réelle, intégrer libpoppler ou MuPDF.
 *
 * TODO: Implémenter le parsing PDF réel avec libpoppler-glib.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "pdf/pdf_parser.h"
#include "utils/logger.h"

SSError pdf_extract_text(const char *file_path, PdfContent *content) {
    if (!file_path || !content) return SS_ERR_NULL_PTR;

    memset(content, 0, sizeof(PdfContent));

    FILE *fp = fopen(file_path, "rb");
    if (!fp) {
        LOG_ERROR("PDF introuvable : %s", file_path);
        return SS_ERR_PDF_OPEN;
    }

    /* Vérifier la signature PDF (%PDF-) */
    char magic[5] = {0};
    fread(magic, 1, 4, fp);
    if (strncmp(magic, "%PDF", 4) != 0) {
        LOG_ERROR("Fichier n'est pas un PDF valide : %s", file_path);
        fclose(fp);
        return SS_ERR_PDF_PARSE;
    }

    /*
     * TODO: Implémenter l'extraction réelle avec libpoppler.
     * Pour l'instant, on retourne un placeholder.
     *
     * Exemple avec poppler-glib :
     *   PopplerDocument *doc = poppler_document_new_from_file(uri, NULL, &error);
     *   for (int i = 0; i < poppler_document_get_n_pages(doc); i++) {
     *       PopplerPage *page = poppler_document_get_page(doc, i);
     *       char *text = poppler_page_get_text(page);
     *       // concaténer au buffer
     *   }
     */

    content->text = strdup("[Extraction PDF — implémentation libpoppler requise]");
    content->page_count = 0;
    content->text_length = strlen(content->text);

    fclose(fp);
    LOG_INFO("PDF ouvert : %s", file_path);
    return SS_OK;
}

void pdf_content_free(PdfContent *content) {
    if (content) {
        free(content->text);
        content->text = NULL;
    }
}
