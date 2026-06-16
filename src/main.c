/**
 * @file main.c
 * @brief Point d'entrée de SmartStudy AI.
 *
 * Initialise l'application (config, DB, HTTP), puis lance la boucle
 * principale ou le mode CLI selon les arguments.
 */

#include <stdio.h>
#include <stdlib.h>
#include "core/app.h"
#include "core/config.h"
#include "core/error.h"
#include "utils/logger.h"

#define SMARTSTUDY_VERSION "0.1.0"

static void print_usage(const char *prog) {
    printf("SmartStudy AI v%s\n", SMARTSTUDY_VERSION);
    printf("Usage: %s [options]\n\n", prog);
    printf("Options:\n");
    printf("  --env <path>    Chemin vers le fichier .env (défaut: .env)\n");
    printf("  --help          Affiche cette aide\n");
    printf("  --version       Affiche la version\n");
}

int main(int argc, char *argv[]) {
    const char *env_path = ".env";

    /* --- Parse des arguments CLI --- */
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--help") == 0) {
            print_usage(argv[0]);
            return 0;
        }
        if (strcmp(argv[i], "--version") == 0) {
            printf("SmartStudy AI v%s\n", SMARTSTUDY_VERSION);
            return 0;
        }
        if (strcmp(argv[i], "--env") == 0 && i + 1 < argc) {
            env_path = argv[++i];
        }
    }

    /* --- Initialisation de l'application --- */
    SmartStudyApp app = {0};
    SSError err = app_init(&app, env_path);
    if (err != SS_OK) {
        fprintf(stderr, "Erreur d'initialisation : %s\n", ss_error_str(err));
        return EXIT_FAILURE;
    }

    LOG_INFO("SmartStudy AI v%s démarré avec succès.", SMARTSTUDY_VERSION);

    /* --- Boucle principale (placeholder) --- */
    printf("\n🎓 SmartStudy AI v%s\n", SMARTSTUDY_VERSION);
    printf("   Base de données : prête\n");
    printf("   Tapez 'quit' pour quitter.\n\n");

    /* TODO: Implémenter la boucle interactive CLI ou le serveur HTTP */

    /* --- Nettoyage --- */
    app_shutdown(&app);
    LOG_INFO("Application terminée proprement.");

    return EXIT_SUCCESS;
}
