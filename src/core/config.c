/**
 * @file config.c
 * @brief Implémentation du parsing de fichiers .env.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "core/config.h"
#include "utils/string_utils.h"

/** Entrée clé-valeur */
typedef struct {
    char key[CONFIG_MAX_LEN];
    char value[CONFIG_MAX_LEN];
} ConfigEntry;

/** Stockage statique de la configuration */
static ConfigEntry g_entries[CONFIG_MAX_ENTRIES];
static int g_entry_count = 0;

static void config_export_env_value(const char *key, const char *value) {
    if (!key || !value) return;

#ifdef _WIN32
    _putenv_s(key, value);
#else
    setenv(key, value, 1);
#endif
}

int config_load(const char *filepath) {
    FILE *fp = fopen(filepath, "r");
    if (!fp) return -1;

    char line[CONFIG_MAX_LEN * 2];
    g_entry_count = 0;

    while (fgets(line, sizeof(line), fp) && g_entry_count < CONFIG_MAX_ENTRIES) {
        /* Ignorer les commentaires et lignes vides */
        char *trimmed = str_trim(line);
        if (trimmed[0] == '#' || trimmed[0] == '\0') continue;

        /* Trouver le séparateur '=' */
        char *eq = strchr(trimmed, '=');
        if (!eq) continue;

        *eq = '\0';
        char *key   = str_trim(trimmed);
        char *value = str_trim(eq + 1);

        /* Retirer les guillemets optionnels autour de la valeur */
        size_t vlen = strlen(value);
        if (vlen >= 2 && ((value[0] == '"' && value[vlen-1] == '"') ||
                          (value[0] == '\'' && value[vlen-1] == '\''))) {
            value[vlen-1] = '\0';
            value++;
        }

        strncpy(g_entries[g_entry_count].key,   key,   CONFIG_MAX_LEN - 1);
        strncpy(g_entries[g_entry_count].value, value, CONFIG_MAX_LEN - 1);
        g_entries[g_entry_count].key[CONFIG_MAX_LEN - 1] = '\0';
        g_entries[g_entry_count].value[CONFIG_MAX_LEN - 1] = '\0';
        config_export_env_value(g_entries[g_entry_count].key, g_entries[g_entry_count].value);
        g_entry_count++;
    }

    fclose(fp);
    return 0;
}

const char *config_get(const char *key, const char *default_value) {
    for (int i = 0; i < g_entry_count; i++) {
        if (strcmp(g_entries[i].key, key) == 0) {
            return g_entries[i].value;
        }
    }
    return default_value;
}

int config_get_int(const char *key, int default_value) {
    const char *val = config_get(key, NULL);
    if (!val) return default_value;
    return atoi(val);
}

void config_free(void) {
    g_entry_count = 0;
    memset(g_entries, 0, sizeof(g_entries));
}
