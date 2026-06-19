/**
 * @file main.c
 * @brief Point d'entrée de SmartStudy AI.
 *
 * Initialise l'application (config, DB, HTTP), puis lance la boucle
 * principale ou le mode CLI selon les arguments.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>
#include <stdint.h>
#include <sqlite3.h>
#include "cJSON/cJSON.h"
#include "core/app.h"
#include "core/config.h"
#include "core/error.h"
#include "utils/logger.h"
#include "server/http_server.h"

#define SMARTSTUDY_VERSION "0.1.0"

typedef struct {
    const char *env_path;
    bool show_help;
    bool show_version;
    bool register_mode;
    char email[256];
    char username[128];
    char password[256];
    bool has_email;
    bool has_username;
    bool has_password;
} CliOptions;

static void cli_options_init(CliOptions *options) {
    if (!options) return;
    memset(options, 0, sizeof(*options));
    options->env_path = ".env";
}

static void print_usage(const char *prog) {
    printf("SmartStudy AI v%s\n", SMARTSTUDY_VERSION);
    printf("Usage: %s [options]\n\n", prog);
    printf("Options:\n");
    printf("  --env <path>          Chemin vers le fichier .env (défaut: .env)\n");
    printf("  --register            Crée un compte via le CLI\n");
    printf("  --email <value>       Email du compte à créer\n");
    printf("  --username <value>    Nom d'utilisateur du compte à créer\n");
    printf("  --password <value>    Mot de passe du compte à créer\n");
    printf("  --help                Affiche cette aide\n");
    printf("  --version             Affiche la version\n\n");
    printf("Exemple:\n");
    printf("  %s --register --email user@example.com --username user --password secret123\n", prog);
}

static uint64_t fnv1a64(const char *value, uint64_t seed) {
    uint64_t hash = 1469598103934665603ULL ^ seed;

    while (value && *value) {
        hash ^= (unsigned char) *value++;
        hash *= 1099511628211ULL;
    }

    return hash;
}

static bool hash_password_sha256(const char *password, char out_hash[65]) {
    static const uint64_t salts[4] = {
        0x9e3779b97f4a7c15ULL,
        0xc2b2ae3d27d4eb4fULL,
        0x165667b19e3779f9ULL,
        0x85ebca77c2b2ae63ULL
    };

    if (!password || !out_hash) return false;

    for (int i = 0; i < 4; i++) {
        unsigned long long part = (unsigned long long) fnv1a64(password, salts[i]);
        snprintf(out_hash + (i * 16), 17, "%016llx", part);
    }

    out_hash[64] = '\0';
    return true;
}

static bool email_looks_valid(const char *email) {
    const char *at = email ? strchr(email, '@') : NULL;
    return at && at != email && at[1] != '\0' && strchr(at + 1, '.');
}

static void trim_newline(char *value) {
    size_t len;

    if (!value) return;

    len = strlen(value);
    while (len > 0 && (value[len - 1] == '\n' || value[len - 1] == '\r')) {
        value[len - 1] = '\0';
        len--;
    }
}

static bool prompt_value(const char *label, char *out, size_t out_size) {
    if (!label || !out || out_size == 0) return false;

    printf("%s: ", label);
    fflush(stdout);

    if (!fgets(out, (int) out_size, stdin)) {
        out[0] = '\0';
        return false;
    }

    trim_newline(out);
    return out[0] != '\0';
}

static bool build_settings_json(const char *username, char *out_json, size_t out_size) {
    cJSON *settings;
    char *json = NULL;

    if (!username || !out_json || out_size == 0) return false;

    settings = cJSON_CreateObject();
    if (!settings) return false;

    cJSON_AddStringToObject(settings, "username", username);
    cJSON_AddStringToObject(settings, "auth_provider", "password");

    json = cJSON_PrintUnformatted(settings);
    cJSON_Delete(settings);

    if (!json) return false;

    snprintf(out_json, out_size, "%s", json);
    free(json);
    return true;
}

static bool cli_register_user(sqlite3 *db, const char *email, const char *username, const char *password) {
    sqlite3_stmt *stmt = NULL;
    char password_hash[65];
    char settings_json[512];
    int rc;

    if (!db || !email || !username || !password) return false;

    if (!email_looks_valid(email)) {
        fprintf(stderr, "L'adresse email n'est pas valide.\n");
        return false;
    }

    if (username[0] == '\0') {
        fprintf(stderr, "Le nom d'utilisateur est requis.\n");
        return false;
    }

    if (strlen(password) < 8) {
        fprintf(stderr, "Le mot de passe doit contenir au moins 8 caractères.\n");
        return false;
    }

    if (!hash_password_sha256(password, password_hash)) {
        fprintf(stderr, "Impossible de hacher le mot de passe.\n");
        return false;
    }

    if (!build_settings_json(username, settings_json, sizeof(settings_json))) {
        fprintf(stderr, "Impossible de construire les paramètres du compte.\n");
        return false;
    }

    rc = sqlite3_prepare_v2(db, "SELECT 1 FROM users WHERE email = ? LIMIT 1;", -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Erreur SQLite: %s\n", sqlite3_errmsg(db));
        return false;
    }

    sqlite3_bind_text(stmt, 1, email, -1, SQLITE_TRANSIENT);
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc == SQLITE_ROW) {
        fprintf(stderr, "Un compte existe déjà avec cet email.\n");
        return false;
    }

    rc = sqlite3_prepare_v2(db, "INSERT INTO users (email, password_hash, settings_json) VALUES (?, ?, ?);", -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "Erreur SQLite: %s\n", sqlite3_errmsg(db));
        return false;
    }

    sqlite3_bind_text(stmt, 1, email, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 2, password_hash, -1, SQLITE_TRANSIENT);
    sqlite3_bind_text(stmt, 3, settings_json, -1, SQLITE_TRANSIENT);

    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);

    if (rc != SQLITE_DONE) {
        fprintf(stderr, "Impossible de créer le compte: %s\n", sqlite3_errmsg(db));
        return false;
    }

    printf("Compte créé avec succès pour %s (%s).\n", username, email);
    return true;
}

static int run_register_flow(SmartStudyApp *app, CliOptions *options) {
    if (!app || !options || !app->db_handle) {
        fprintf(stderr, "Initialisation de la base impossible.\n");
        return EXIT_FAILURE;
    }

    if (!options->has_email) {
        if (!prompt_value("Email", options->email, sizeof(options->email))) {
            fprintf(stderr, "Email manquant.\n");
            return EXIT_FAILURE;
        }
        options->has_email = true;
    }

    if (!options->has_username) {
        if (!prompt_value("Nom d'utilisateur", options->username, sizeof(options->username))) {
            fprintf(stderr, "Nom d'utilisateur manquant.\n");
            return EXIT_FAILURE;
        }
        options->has_username = true;
    }

    if (!options->has_password) {
        if (!prompt_value("Mot de passe", options->password, sizeof(options->password))) {
            fprintf(stderr, "Mot de passe manquant.\n");
            return EXIT_FAILURE;
        }
        options->has_password = true;
    }

    return cli_register_user((sqlite3 *) app->db_handle, options->email, options->username, options->password)
        ? EXIT_SUCCESS
        : EXIT_FAILURE;
}

int main(int argc, char *argv[]) {
    SmartStudyApp app = {0};
    CliOptions options;
    int exit_code = EXIT_SUCCESS;

    cli_options_init(&options);

    /* --- Parse des arguments CLI --- */
    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--help") == 0) {
            options.show_help = true;
            continue;
        }
        if (strcmp(argv[i], "--version") == 0) {
            options.show_version = true;
            continue;
        }
        if (strcmp(argv[i], "--env") == 0 && i + 1 < argc) {
            options.env_path = argv[++i];
            continue;
        }
        if (strcmp(argv[i], "--register") == 0) {
            options.register_mode = true;
            continue;
        }
        if (strcmp(argv[i], "--email") == 0 && i + 1 < argc) {
            snprintf(options.email, sizeof(options.email), "%s", argv[++i]);
            options.has_email = true;
            continue;
        }
        if (strcmp(argv[i], "--username") == 0 && i + 1 < argc) {
            snprintf(options.username, sizeof(options.username), "%s", argv[++i]);
            options.has_username = true;
            continue;
        }
        if (strcmp(argv[i], "--password") == 0 && i + 1 < argc) {
            snprintf(options.password, sizeof(options.password), "%s", argv[++i]);
            options.has_password = true;
            continue;
        }
    }

    if (options.show_help) {
        print_usage(argv[0]);
        return EXIT_SUCCESS;
    }

    if (options.show_version) {
        printf("SmartStudy AI v%s\n", SMARTSTUDY_VERSION);
        return EXIT_SUCCESS;
    }

    /* --- Initialisation de l'application --- */
    SSError err = app_init(&app, options.env_path);
    if (err != SS_OK) {
        fprintf(stderr, "Erreur d'initialisation : %s\n", ss_error_str(err));
        return EXIT_FAILURE;
    }

    if (options.register_mode) {
        exit_code = run_register_flow(&app, &options);
        app_shutdown(&app);
        return exit_code;
    }

    LOG_INFO("SmartStudy AI v%s démarré avec succès.", SMARTSTUDY_VERSION);

    /* --- Démarrage du serveur HTTP --- */
    const char *port = getenv("PORT");
    if (!port) port = "8080";

    const char *jwt_secret = getenv("JWT_SECRET");
    if (!jwt_secret) jwt_secret = "default_secret_key_for_dev_only";

    HttpServerConfig server_config = {
        .port = port,
        .jwt_secret = jwt_secret
    };

    printf("\n🎓 SmartStudy AI v%s\n", SMARTSTUDY_VERSION);
    printf("   Base de données : prête\n");
    printf("   Serveur HTTP : démarrage sur le port %s\n\n", port);

    if (!http_server_start(&app, &server_config)) {
        LOG_ERROR("Échec du démarrage du serveur HTTP.");
        app_shutdown(&app);
        return EXIT_FAILURE;
    }

    /* --- Nettoyage (inatteignable sauf arrêt manuel du serveur) --- */
    app_shutdown(&app);
    LOG_INFO("Application terminée proprement.");

    return EXIT_SUCCESS;
}
