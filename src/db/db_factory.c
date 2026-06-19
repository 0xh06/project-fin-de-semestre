/**
 * @file db_factory.c
 * @brief Implémentation de la factory de base de données.
 */

#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include "db/db_factory.h"
#include "core/config.h"
#include "utils/string_utils.h"

/* Les deux interfaces instanciées dans leurs fichiers respectifs */
extern DBInterface sqlite_interface;
extern DBInterface supabase_interface;

DBInterface* db_get_interface(void) {
    const char *mode_str = getenv("DB_MODE");
    
    if (mode_str != NULL && strcasecmp(mode_str, "remote") == 0) {
        return &supabase_interface;
    }
    
    /* Par défaut, on retourne l'interface locale SQLite */
    return &sqlite_interface;
}
