/**
 * @file main_test.c
 * @brief Runner principal pour tous les tests unitaires SmartStudy AI.
 *
 * Exécute toutes les suites de tests et rapporte les résultats.
 */

#include <stdio.h>
#include "unity.h"

// Déclarations externes des fonctions de test
void setUp(void);
void tearDown(void);

// Tests DB
extern int test_db(void);

// Tests JSON Parser
extern int test_json_parser(void);

// Tests SRS
extern int test_srs(void);

// Tests Gamification
extern int test_gamification(void);

int main(void) {
    printf("========================================\n");
    printf("SmartStudy AI - Suite de Tests Unitaires\n");
    printf("========================================\n\n");

    int total_failures = 0;

    // Exécuter les tests DB
    printf("=== Tests Base de Données ===\n");
    UNITY_BEGIN();
    test_db();
    int db_failures = UNITY_END();
    printf("Tests DB: %d échecs\n\n", db_failures);
    total_failures += db_failures;

    // Exécuter les tests JSON Parser
    printf("=== Tests JSON Parser ===\n");
    UNITY_BEGIN();
    test_json_parser();
    int json_failures = UNITY_END();
    printf("Tests JSON: %d échecs\n\n", json_failures);
    total_failures += json_failures;

    // Exécuter les tests SRS
    printf("=== Tests SRS (SM-2) ===\n");
    UNITY_BEGIN();
    test_srs();
    int srs_failures = UNITY_END();
    printf("Tests SRS: %d échecs\n\n", srs_failures);
    total_failures += srs_failures;

    // Exécuter les tests Gamification
    printf("=== Tests Gamification ===\n");
    UNITY_BEGIN();
    test_gamification();
    int gamification_failures = UNITY_END();
    printf("Tests Gamification: %d échecs\n\n", gamification_failures);
    total_failures += gamification_failures;

    // Résumé final
    printf("========================================\n");
    printf("Résumé des Tests\n");
    printf("========================================\n");
    printf("Total échecs: %d\n", total_failures);
    
    if (total_failures == 0) {
        printf("✓ Tous les tests ont réussi!\n");
    } else {
        printf("✗ Certains tests ont échoué.\n");
    }
    printf("========================================\n");

    return total_failures;
}
