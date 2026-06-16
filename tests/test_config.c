/**
 * @file test_config.c
 * @brief Tests unitaires pour le module core/config.
 */

#include <stdio.h>
#include <string.h>
#include "unity.h"
#include "core/config.h"

void test_config_load_and_get(void) {
    /* Créer un fichier .env temporaire */
    FILE *fp = fopen("test_temp.env", "w");
    TEST_ASSERT_NOT_NULL(fp);
    fprintf(fp, "# Commentaire\n");
    fprintf(fp, "KEY_ONE=value_one\n");
    fprintf(fp, "KEY_TWO=\"quoted value\"\n");
    fprintf(fp, "KEY_INT=42\n");
    fprintf(fp, "\n");  /* ligne vide */
    fprintf(fp, "KEY_EMPTY=\n");
    fclose(fp);

    /* Charger */
    int rc = config_load("test_temp.env");
    TEST_ASSERT_EQUAL_INT(0, rc);

    /* Vérifier les valeurs */
    TEST_ASSERT_EQUAL_STRING("value_one", config_get("KEY_ONE", ""));
    TEST_ASSERT_EQUAL_STRING("quoted value", config_get("KEY_TWO", ""));
    TEST_ASSERT_EQUAL_INT(42, config_get_int("KEY_INT", 0));

    /* Valeur par défaut pour clé inexistante */
    TEST_ASSERT_EQUAL_STRING("default", config_get("MISSING", "default"));
    TEST_ASSERT_EQUAL_INT(99, config_get_int("MISSING", 99));

    /* Nettoyage */
    config_free();
    remove("test_temp.env");
}
