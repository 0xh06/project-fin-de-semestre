/**
 * @file document_analyzer.c
 * @brief Implémentation de l'analyse de documents avec IA.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "document/document_analyzer.h"
#include "document/document_parser.h"
#include "api/ai_client.h"
#include "db/db.h"
#include "utils/json_helper.h"
#include "utils/logger.h"

#define WORD_THRESHOLD_MAP_REDUCE 10000
#define FLASHCARD_COUNT 10
#define KEY_CONCEPT_COUNT 5

/**
 * Compte le nombre de mots dans une chaîne.
 */
static int count_words(const char *text) {
    if (!text) return 0;
    
    int count = 0;
    int in_word = 0;
    
    for (const char *p = text; *p; p++) {
        if (isspace((unsigned char)*p)) {
            in_word = 0;
        } else if (!in_word) {
            in_word = 1;
            count++;
        }
    }
    
    return count;
}

/**
 * Génère un résumé partiel pour un chunk de texte.
 */
static SSError generate_chunk_summary(const char *chunk, char **summary_out) {
    char prompt[4096];
    snprintf(prompt, sizeof(prompt),
        "Résume ce texte de manière concise en français (max 200 mots):\n\n%s",
        chunk);
    
    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        return err;
    }
    
    cJSON *root = json_parse(response_json);
    free(response_json);
    
    if (!root) {
        return SS_ERR_JSON_PARSE;
    }
    
    const char *text = json_get_string(root, "text");
    if (!text) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }
    
    *summary_out = strdup(text);
    cJSON_Delete(root);
    
    if (!*summary_out) {
        return SS_ERR_ALLOC;
    }
    
    return SS_OK;
}

/**
 * Combine plusieurs résumés partiels en un résumé final.
 */
static SSError combine_summaries(const char **summaries, int count, char **final_summary_out) {
    if (count == 0) {
        *final_summary_out = strdup("");
        return *final_summary_out ? SS_OK : SS_ERR_ALLOC;
    }
    
    if (count == 1) {
        *final_summary_out = strdup(summaries[0]);
        return *final_summary_out ? SS_OK : SS_ERR_ALLOC;
    }
    
    char prompt[8192];
    char *ptr = prompt;
    size_t remaining = sizeof(prompt);
    
    ptr += snprintf(ptr, remaining,
        "Combine ces %d résumés partiels en un résumé final cohérent et structuré en français (max 500 mots):\n\n",
        count);
    remaining = sizeof(prompt) - (ptr - prompt);
    
    for (int i = 0; i < count && remaining > 100; i++) {
        ptr += snprintf(ptr, remaining, "--- Résumé %d ---\n%s\n\n", i + 1, summaries[i]);
        remaining = sizeof(prompt) - (ptr - prompt);
    }
    
    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        return err;
    }
    
    cJSON *root = json_parse(response_json);
    free(response_json);
    
    if (!root) {
        return SS_ERR_JSON_PARSE;
    }
    
    const char *text = json_get_string(root, "text");
    if (!text) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }
    
    *final_summary_out = strdup(text);
    cJSON_Delete(root);
    
    if (!*final_summary_out) {
        return SS_ERR_ALLOC;
    }
    
    return SS_OK;
}

/**
 * Génère des flashcards à partir du texte.
 */
static SSError generate_flashcards(const char *text, GeneratedFlashcard **cards_out, int *count_out) {
    char prompt[8192];
    snprintf(prompt, sizeof(prompt),
        "Génère exactement %d flashcards (question/réponse) en français basées sur ce texte. "
        "Format JSON: [{\"question\": \"...\", \"answer\": \"...\"}]\n\nTexte:\n%s",
        FLASHCARD_COUNT, text);
    
    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        return err;
    }
    
    cJSON *root = json_parse(response_json);
    free(response_json);
    
    if (!root) {
        return SS_ERR_JSON_PARSE;
    }
    
    const char *text_content = json_get_string(root, "text");
    if (!text_content) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }
    
    cJSON *cards_array = cJSON_Parse(text_content);
    cJSON_Delete(root);
    
    if (!cards_array || !cJSON_IsArray(cards_array)) {
        return SS_ERR_JSON_PARSE;
    }
    
    int array_size = cJSON_GetArraySize(cards_array);
    int actual_count = array_size > FLASHCARD_COUNT ? FLASHCARD_COUNT : array_size;
    
    GeneratedFlashcard *cards = calloc(actual_count, sizeof(GeneratedFlashcard));
    if (!cards) {
        cJSON_Delete(cards_array);
        return SS_ERR_ALLOC;
    }
    
    for (int i = 0; i < actual_count; i++) {
        cJSON *card_obj = cJSON_GetArrayItem(cards_array, i);
        if (!card_obj) continue;
        
        const char *question = json_get_string(card_obj, "question");
        const char *answer = json_get_string(card_obj, "answer");
        
        if (question) cards[i].question = strdup(question);
        if (answer) cards[i].answer = strdup(answer);
    }
    
    cJSON_Delete(cards_array);
    
    *cards_out = cards;
    *count_out = actual_count;
    
    return SS_OK;
}

/**
 * Identifie les concepts clés.
 */
static SSError identify_key_concepts(const char *text, KeyConcept **concepts_out, int *count_out) {
    char prompt[8192];
    snprintf(prompt, sizeof(prompt),
        "Identifie les %d concepts clés les plus importants dans ce texte. "
        "Format JSON: [{\"name\": \"...\", \"description\": \"...\"}]\n\nTexte:\n%s",
        KEY_CONCEPT_COUNT, text);
    
    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        return err;
    }
    
    cJSON *root = json_parse(response_json);
    free(response_json);
    
    if (!root) {
        return SS_ERR_JSON_PARSE;
    }
    
    const char *text_content = json_get_string(root, "text");
    if (!text_content) {
        cJSON_Delete(root);
        return SS_ERR_JSON_PARSE;
    }
    
    cJSON *concepts_array = cJSON_Parse(text_content);
    cJSON_Delete(root);
    
    if (!concepts_array || !cJSON_IsArray(concepts_array)) {
        return SS_ERR_JSON_PARSE;
    }
    
    int array_size = cJSON_GetArraySize(concepts_array);
    int actual_count = array_size > KEY_CONCEPT_COUNT ? KEY_CONCEPT_COUNT : array_size;
    
    KeyConcept *concepts = calloc(actual_count, sizeof(KeyConcept));
    if (!concepts) {
        cJSON_Delete(concepts_array);
        return SS_ERR_ALLOC;
    }
    
    for (int i = 0; i < actual_count; i++) {
        cJSON *concept_obj = cJSON_GetArrayItem(concepts_array, i);
        if (!concept_obj) continue;
        
        const char *name = json_get_string(concept_obj, "name");
        const char *description = json_get_string(concept_obj, "description");
        
        if (name) concepts[i].name = strdup(name);
        if (description) concepts[i].description = strdup(description);
    }
    
    cJSON_Delete(concepts_array);
    
    *concepts_out = concepts;
    *count_out = actual_count;
    
    return SS_OK;
}

/**
 * Génère un plan de mind map en JSON.
 */
static SSError generate_mindmap(const char *text, char **mindmap_json_out) {
    char prompt[8192];
    snprintf(prompt, sizeof(prompt),
        "Génère une structure de mind map hiérarchique pour ce texte. "
        "Format JSON: {\"nodes\": [{\"id\": \"1\", \"label\": \"...\", \"parentId\": \"0\"}]}\n"
        "L'ID \"0\" est la racine. Utilise des IDs numériques simples.\n\nTexte:\n%s",
        text);
    
    char *response_json = NULL;
    SSError err = gemini_generate(prompt, &response_json);
    if (err != SS_OK) {
        return err;
    }
    
    cJSON *root = json_parse(response_json);
    free(response_json);
    
    if (!root) {
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
        return SS_ERR_JSON_PARSE;
    }
    
    char *mindmap_str = cJSON_PrintUnformatted(mindmap_obj);
    cJSON_Delete(mindmap_obj);
    
    if (!mindmap_str) {
        return SS_ERR_ALLOC;
    }
    
    *mindmap_json_out = mindmap_str;
    
    return SS_OK;
}

/**
 * Sauvegarde l'analyse complète en base de données.
 */
static SSError save_analysis_to_db(const char *filepath, int64_t user_id, 
                                   const DocumentAnalysis *analysis, int64_t *doc_id_out) {
    DBError db_err;
    
    // Sauvegarde du document
    DBDocument doc;
    memset(&doc, 0, sizeof(doc));
    doc.user_id = user_id;
    doc.filename = strdup(filepath);
    doc.content_text = strdup(analysis->summary ? analysis->summary : "");
    doc.summary_ai = strdup(analysis->summary ? analysis->summary : "");
    doc.tags = strdup("analyzed");
    
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    char timestamp[32];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", tm_info);
    doc.uploaded_at = strdup(timestamp);
    
    db_err = document_save(&doc, doc_id_out);
    
    free(doc.filename);
    free(doc.content_text);
    free(doc.summary_ai);
    free(doc.tags);
    free(doc.uploaded_at);
    
    if (db_err != DB_OK) {
        LOG_ERROR("Erreur sauvegarde document: %s", db_error_msg());
        return SS_ERR_DB_QUERY;
    }
    
    int64_t document_id = *doc_id_out;
    
    // Sauvegarde des flashcards
    for (int i = 0; i < analysis->flashcard_count; i++) {
        DBFlashcard card;
        memset(&card, 0, sizeof(card));
        card.document_id = document_id;
        card.user_id = user_id;
        card.front = analysis->flashcards[i].question;
        card.back = analysis->flashcards[i].answer;
        card.difficulty = 2.5;
        card.interval_days = 1;
        card.next_review = strdup(timestamp);
        
        int64_t card_id;
        db_err = flashcard_save(&card, &card_id);
        free(card.next_review);
        
        if (db_err != DB_OK) {
            LOG_WARN("Erreur sauvegarde flashcard %d", i);
        }
    }
    
    return SS_OK;
}

SSError analyze_document(const char *filepath, int64_t user_id, DocumentAnalysis *out) {
    if (!filepath || !out) {
        return SS_ERR_NULL_PTR;
    }
    
    memset(out, 0, sizeof(DocumentAnalysis));
    
    LOG_INFO("Début analyse document: %s", filepath);
    
    // 1. Extraction et chunking du texte
    ParsedDocument parsed;
    SSError err = parse_document(filepath, &parsed);
    if (err != SS_OK) {
        LOG_ERROR("Erreur parsing document: %d", err);
        return err;
    }
    
    int word_count = count_words(parsed.full_text);
    LOG_INFO("Document: %d mots, %d chunks", word_count, parsed.chunk_count);
    
    // 2. Stratégie map-reduce si > 10 000 mots
    if (word_count > WORD_THRESHOLD_MAP_REDUCE) {
        LOG_INFO("Document volumineux, utilisation stratégie map-reduce");
        
        // Map: générer des résumés partiels pour chaque chunk
        char **chunk_summaries = calloc(parsed.chunk_count, sizeof(char*));
        if (!chunk_summaries) {
            parsed_document_free(&parsed);
            return SS_ERR_ALLOC;
        }
        
        int successful_summaries = 0;
        for (int i = 0; i < parsed.chunk_count; i++) {
            err = generate_chunk_summary(parsed.chunks[i].text, &chunk_summaries[i]);
            if (err == SS_OK) {
                successful_summaries++;
                LOG_DEBUG("Résumé chunk %d/%d généré", i + 1, parsed.chunk_count);
            } else {
                chunk_summaries[i] = NULL;
                LOG_WARN("Échec résumé chunk %d", i);
            }
        }
        
        // Reduce: combiner les résumés
        if (successful_summaries > 0) {
            err = combine_summaries((const char**)chunk_summaries, parsed.chunk_count, &out->summary);
        } else {
            err = SS_ERR_API_LIMIT;
        }
        
        // Libération
        for (int i = 0; i < parsed.chunk_count; i++) {
            free(chunk_summaries[i]);
        }
        free(chunk_summaries);
        
        if (err != SS_OK) {
            parsed_document_free(&parsed);
            return err;
        }
    } else {
        // Document de taille normale: résumé direct
        err = generate_chunk_summary(parsed.full_text, &out->summary);
        if (err != SS_OK) {
            parsed_document_free(&parsed);
            return err;
        }
    }
    
    LOG_INFO("Résumé généré");
    
    // 3. Génération des flashcards
    err = generate_flashcards(parsed.full_text, &out->flashcards, &out->flashcard_count);
    if (err != SS_OK) {
        LOG_WARN("Erreur génération flashcards: %d", err);
    } else {
        LOG_INFO("%d flashcards générées", out->flashcard_count);
    }
    
    // 4. Identification des concepts clés
    err = identify_key_concepts(parsed.full_text, &out->key_concepts, &out->concept_count);
    if (err != SS_OK) {
        LOG_WARN("Erreur identification concepts: %d", err);
    } else {
        LOG_INFO("%d concepts identifiés", out->concept_count);
    }
    
    // 5. Génération du mind map
    err = generate_mindmap(parsed.full_text, &out->mindmap_json);
    if (err != SS_OK) {
        LOG_WARN("Erreur génération mindmap: %d", err);
    } else {
        LOG_INFO("Mind map générée");
    }
    
    // 6. Sauvegarde en base de données
    err = save_analysis_to_db(filepath, user_id, out, &out->document_id);
    if (err != SS_OK) {
        LOG_ERROR("Erreur sauvegarde DB: %d", err);
    } else {
        LOG_INFO("Document sauvegardé avec ID: %lld", out->document_id);
    }
    
    parsed_document_free(&parsed);
    
    return SS_OK;
}

void document_analysis_free(DocumentAnalysis *analysis) {
    if (!analysis) return;
    
    free(analysis->summary);
    analysis->summary = NULL;
    
    if (analysis->flashcards) {
        for (int i = 0; i < analysis->flashcard_count; i++) {
            free(analysis->flashcards[i].question);
            free(analysis->flashcards[i].answer);
        }
        free(analysis->flashcards);
    }
    analysis->flashcards = NULL;
    analysis->flashcard_count = 0;
    
    if (analysis->key_concepts) {
        for (int i = 0; i < analysis->concept_count; i++) {
            free(analysis->key_concepts[i].name);
            free(analysis->key_concepts[i].description);
        }
        free(analysis->key_concepts);
    }
    analysis->key_concepts = NULL;
    analysis->concept_count = 0;
    
    if (analysis->mindmap_nodes) {
        for (int i = 0; i < analysis->mindmap_node_count; i++) {
            free(analysis->mindmap_nodes[i].id);
            free(analysis->mindmap_nodes[i].label);
            free(analysis->mindmap_nodes[i].parent_id);
        }
        free(analysis->mindmap_nodes);
    }
    analysis->mindmap_nodes = NULL;
    analysis->mindmap_node_count = 0;
    
    free(analysis->mindmap_json);
    analysis->mindmap_json = NULL;
}
