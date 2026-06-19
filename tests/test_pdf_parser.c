/**
 * @file test_pdf_parser.c
 * @brief Tests unitaires pour le module pdf/pdf_parser.
 */

#include <stdio.h>
#include "unity.h"
#include "pdf/pdf_parser.h"
#include "core/error.h"

void test_pdf_invalid_path(void) {
    PdfContent content;
    SSError err = pdf_extract_text("inexistant.pdf", &content);
    TEST_ASSERT_EQUAL_INT(SS_ERR_PDF_OPEN, err);
}

void test_pdf_non_pdf_file(void) {
    /* Créer un faux fichier non-PDF */
    FILE *fp = fopen("test_fake.pdf", "w");
    TEST_ASSERT_NOT_NULL(fp);
    fprintf(fp, "Ceci n'est pas un PDF");
    fclose(fp);

    PdfContent content;
    SSError err = pdf_extract_text("test_fake.pdf", &content);
    TEST_ASSERT_EQUAL_INT(SS_ERR_PDF_PARSE, err);

    remove("test_fake.pdf");
}
