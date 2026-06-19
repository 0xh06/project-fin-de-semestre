/**
 * @file logger.c
 * @brief Implémentation du système de logging multi-niveaux.
 */

#include <stdio.h>
#include <stdarg.h>
#include <time.h>
#include <string.h>
#include "utils/logger.h"

static LogLevel g_min_level = LOG_INFO;
static FILE    *g_log_file  = NULL;

/** Labels colorés pour chaque niveau */
static const char *level_labels[] = {
    "DEBUG", "INFO ", "WARN ", "ERROR"
};

/** Codes ANSI pour chaque niveau */
static const char *level_colors[] = {
    "\033[36m",   /* DEBUG : cyan */
    "\033[32m",   /* INFO  : vert */
    "\033[33m",   /* WARN  : jaune */
    "\033[31m",   /* ERROR : rouge */
};

#define ANSI_RESET "\033[0m"

void logger_init(LogLevel level, FILE *log_file) {
    g_min_level = level;
    g_log_file  = log_file ? log_file : stderr;
}

void logger_log(LogLevel level, const char *file, int line,
                const char *fmt, ...) {
    if (level < g_min_level) return;
    if (!g_log_file) g_log_file = stderr;

    /* Horodatage */
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    char timestamp[20];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", tm_info);

    /* Extraire le nom de fichier (sans le chemin) */
    const char *basename = strrchr(file, '/');
    if (!basename) basename = strrchr(file, '\\');
    basename = basename ? basename + 1 : file;

    /* Écrire l'en-tête du log */
    fprintf(g_log_file, "%s[%s] %s %s:%d%s » ",
            level_colors[level],
            timestamp,
            level_labels[level],
            basename, line,
            ANSI_RESET);

    /* Écrire le message */
    va_list args;
    va_start(args, fmt);
    vfprintf(g_log_file, fmt, args);
    va_end(args);

    fprintf(g_log_file, "\n");
    fflush(g_log_file);
}
