/**
 * @file db_interface.h
 * @brief Interface d'abstraction polymorphique pour la base de données.
 */

#ifndef SMARTSTUDY_DB_INTERFACE_H
#define SMARTSTUDY_DB_INTERFACE_H

#include "db/db.h"

/**
 * Interface d'abstraction CRUD.
 * Contient des pointeurs de fonctions vers l'implémentation active (SQLite ou Supabase).
 */
typedef struct {
    /** Initialisation de la connexion (path pour SQLite, URL pour Supabase) */
    DBError (*init)(const char *config_str);
    void    (*close)(void);
    
    DBError (*begin)(void);
    DBError (*commit)(void);
    DBError (*rollback)(void);

    /* CRUD Users */
    DBError (*user_create)(const char *email, const char *password_hash, const char *settings_json, int64_t *out_id);
    DBError (*user_find_by_email)(const char *email, DBUser *out_user);
    
    /* CRUD Documents */
    DBError (*document_save)(const DBDocument *doc, int64_t *out_id);
    DBError (*document_get_all_by_user)(int64_t user_id, DBDocument **out_docs, int *out_count);
    
    /* CRUD Flashcards */
    DBError (*flashcard_save)(const DBFlashcard *card, int64_t *out_id);
    DBError (*flashcard_update_review)(int64_t card_id, double difficulty, int interval_days, const char *next_review);
    DBError (*flashcard_list_due_today)(int64_t user_id, DBFlashcard **out_cards, int *out_count);
    
    /* CRUD Chat */
    DBError (*chat_message_save)(const DBChatMessage *msg, int64_t *out_id);

    /* Free helpers */
    void (*user_free)(DBUser *user);
    void (*document_list_free)(DBDocument *docs, int count);
    void (*flashcard_list_free)(DBFlashcard *cards, int count);

} DBInterface;

#endif /* SMARTSTUDY_DB_INTERFACE_H */
