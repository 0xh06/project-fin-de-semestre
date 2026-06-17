/**
 * @file document_parser.c
 * @brief Implémentation de l'extraction de texte et chunking.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "document/document_parser.h"
#include "utils/logger.h"

#define CHUNK_TARGET_TOKENS 2000
#define CHARS_PER_TOKEN 4
#define CHUNK_TARGET_CHARS (CHUNK_TARGET_TOKENS * CHARS_PER_TOKEN)

/**
 * Extrait le texte d'un fichier TXT.
 */
static SSError extract_text_from_txt(const char *filepath, char **out_text, size_t *out_length) {
    FILE *fp = fopen(filepath, "r");
    if (!fp) {
        LOG_ERROR("Impossible d'ouvrir le fichier TXT: %s", filepath);
        return SS_ERR_FILE_NOT_FOUND;
    }

    fseek(fp, 0, SEEK_END);
    long file_size = ftell(fp);
    fseek(fp, 0, SEEK_SET);

    char *text = malloc(file_size + 1);
    if (!text) {
        fclose(fp);
        return SS_ERR_ALLOC;
    }

    size_t read_size = fread(text, 1, file_size, fp);
    text[read_size] = '\0';
    fclose(fp);

    *out_text = text;
    *out_length = read_size;
    return SS_OK;
}

/**
 * Extrait le texte d'un fichier PDF via pdftotext (popen).
 */
static SSError extract_text_from_pdf_pdetotext(const char *filepath, char **out_text, size_t *out_length) {
    char cmd[1024];
    snprintf(cmd, sizeof(cmd), "pdftotext \"%s\" -", filepath);

    FILE *fp = popen(cmd, "r");
    if (!fp) {
        LOG_WARN("pdftotext non disponible, tentative mupdf échouée pour: %s", filepath);
        return SS_ERR_FILE_READ;
    }

    char *buffer = NULL;
    size_t buffer_size = 0;
    size_t buffer_capacity = 4096;
    buffer = malloc(buffer_capacity);
    if (!buffer) {
        pclose(fp);
        return SS_ERR_ALLOC;
    }

    char chunk[4096];
    size_t bytes_read;
    while ((bytes_read = fread(chunk, 1, sizeof(chunk), fp)) > 0) {
        if (buffer_size + bytes_read >= buffer_capacity) {
            buffer_capacity *= 2;
            char *new_buffer = realloc(buffer, buffer_capacity);
            if (!new_buffer) {
                free(buffer);
                pclose(fp);
                return SS_ERR_ALLOC;
            }
            buffer = new_buffer;
        }
        memcpy(buffer + buffer_size, chunk, bytes_read);
        buffer_size += bytes_read;
    }

    buffer[buffer_size] = '\0';
    pclose(fp);

    if (buffer_size == 0) {
        free(buffer);
        return SS_ERR_FILE_READ;
    }

    *out_text = buffer;
    *out_length = buffer_size;
    return SS_OK;
}

/**
 * Extrait le texte d'un fichier PDF via mutool (mupdf).
 */
static SSError extract_text_from_pdf_mutool(const char *filepath, char **out_text, size_t *out_length) {
    char cmd[1024];
    snprintf(cmd, sizeof(cmd), "mutool draw -F txt \"%s\"", filepath);

    FILE *fp = popen(cmd, "r");
    if (!fp) {
        LOG_ERROR("mutool non disponible pour: %s", filepath);
        return SS_ERR_FILE_READ;
    }

    char *buffer = NULL;
    size_t buffer_size = 0;
    size_t buffer_capacity = 4096;
    buffer = malloc(buffer_capacity);
    if (!buffer) {
        pclose(fp);
        return SS_ERR_ALLOC;
    }

    char chunk[4096];
    size_t bytes_read;
    while ((bytes_read = fread(chunk, 1, sizeof(chunk), fp)) > 0) {
        if (buffer_size + bytes_read >= buffer_capacity) {
            buffer_capacity *= 2;
            char *new_buffer = realloc(buffer, buffer_capacity);
            if (!new_buffer) {
                free(buffer);
                pclose(fp);
                return SS_ERR_ALLOC;
            }
            buffer = new_buffer;
        }
        memcpy(buffer + buffer_size, chunk, bytes_read);
        buffer_size += bytes_read;
    }

    buffer[buffer_size] = '\0';
    pclose(fp);

    if (buffer_size == 0) {
        free(buffer);
        return SS_ERR_FILE_READ;
    }

    *out_text = buffer;
    *out_length = buffer_size;
    return SS_OK;
}

/**
 * Détermine le type de fichier par extension.
 */
static int is_pdf_file(const char *filepath) {
    const char *ext = strrchr(filepath, '.');
    if (!ext) return 0;
    return (strcasecmp(ext, ".pdf") == 0);
}

/**
 * Découpe le texte en chunks de ~2000 tokens.
 * Essaie de couper aux limites de phrases/paragraphes.
 */
static SSError chunk_text(const char *text, size_t text_length, TextChunk **out_chunks, int *out_count) {
    if (!text || text_length == 0) {
        *out_chunks = NULL;
        *out_count = 0;
        return SS_OK;
    }

    int estimated_chunks = (text_length / CHUNK_TARGET_CHARS) + 1;
    TextChunk *chunks = calloc(estimated_chunks, sizeof(TextChunk));
    if (!chunks) {
        return SS_ERR_ALLOC;
    }

    int chunk_index = 0;
    size_t pos = 0;
    size_t chunk_start = 0;

    while (pos < text_length) {
        size_t chunk_end = chunk_start + CHUNK_TARGET_CHARS;
        
        if (chunk_end >= text_length) {
            chunk_end = text_length;
        } else {
            // Cherche une limite de phrase (., !, ?) suivie d'espace
            size_t best_break = chunk_end;
            for (size_t i = chunk_end; i > chunk_start + CHUNK_TARGET_CHARS / 2 && i < text_length; i--) {
                if (text[i] == '.' || text[i] == '!' || text[i] == '?') {
                    if (i + 1 < text_length && isspace(text[i + 1])) {
                        best_break = i + 1;
                        break;
                    }
                }
            }
            chunk_end = best_break;
        }

        size_t chunk_len = chunk_end - chunk_start;
        if (chunk_len == 0) {
            chunk_len = 1;
        }

        chunks[chunk_index].text = malloc(chunk_len + 1);
        if (!chunks[chunk_index].text) {
            for (int i = 0; i < chunk_index; i++) {
                free(chunks[i].text);
            }
            free(chunks);
            return SS_ERR_ALLOC;
        }

        memcpy(chunks[chunk_index].text, text + chunk_start, chunk_len);
        chunks[chunk_index].text[chunk_len] = '\0';
        chunks[chunk_index].char_count = chunk_len;
        chunks[chunk_index].token_count = chunk_len / CHARS_PER_TOKEN;

        chunk_index++;
        chunk_start = chunk_end;
        pos = chunk_end;

        if (chunk_index >= estimated_chunks) {
            estimated_chunks *= 2;
            TextChunk *new_chunks = realloc(chunks, estimated_chunks * sizeof(TextChunk));
            if (!new_chunks) {
                for (int i = 0; i < chunk_index; i++) {
                    free(chunks[i].text);
                }
                free(chunks);
                return SS_ERR_ALLOC;
            }
            chunks = new_chunks;
            memset(chunks + chunk_index, 0, (estimated_chunks - chunk_index) * sizeof(TextChunk));
        }
    }

    *out_chunks = chunks;
    *out_count = chunk_index;
    return SS_OK;
}

SSError parse_document(const char *filepath, ParsedDocument *out) {
    if (!filepath || !out) {
        return SS_ERR_NULL_PTR;
    }

    memset(out, 0, sizeof(ParsedDocument));

    char *text = NULL;
    size_t text_length = 0;
    SSError err;

    if (is_pdf_file(filepath)) {
        LOG_INFO("Extraction PDF: %s", filepath);
        err = extract_text_from_pdf_pdetotext(filepath, &text, &text_length);
        if (err != SS_OK) {
            err = extract_text_from_pdf_mutool(filepath, &text, &text_length);
        }
        if (err != SS_OK) {
            LOG_ERROR("Échec extraction PDF: %s", filepath);
            return err;
        }
    } else {
        LOG_INFO("Extraction TXT: %s", filepath);
        err = extract_text_from_txt(filepath, &text, &text_length);
        if (err != SS_OK) {
            return err;
        }
    }

    out->full_text = text;
    out->total_chars = text_length;
    out->estimated_tokens = text_length / CHARS_PER_TOKEN;

    LOG_INFO("Texte extrait: %zu chars, ~%d tokens", text_length, out->estimated_tokens);

    err = chunk_text(text, text_length, &out->chunks, &out->chunk_count);
    if (err != SS_OK) {
        free(text);
        out->full_text = NULL;
        return err;
    }

    LOG_INFO("Document découpé en %d chunks", out->chunk_count);
    return SS_OK;
}

void parsed_document_free(ParsedDocument *doc) {
    if (!doc) return;
    
    free(doc->full_text);
    doc->full_text = NULL;
    
    text_chunks_free(doc->chunks, doc->chunk_count);
    doc->chunks = NULL;
    doc->chunk_count = 0;
}

void text_chunks_free(TextChunk *chunks, int count) {
    if (!chunks) return;
    
    for (int i = 0; i < count; i++) {
        free(chunks[i].text);
    }
    free(chunks);
}
