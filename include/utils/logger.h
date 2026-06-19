/**
 * @file logger.h
 * @brief Système de logging multi-niveaux.
 *
 * Fournit des macros de logging avec horodatage, niveau et localisation
 * dans le code source (fichier + ligne).
 */

#ifndef SMARTSTUDY_UTILS_LOGGER_H
#define SMARTSTUDY_UTILS_LOGGER_H

#include <stdio.h>

/** Niveaux de log */
typedef enum {
    LOG_DEBUG = 0,
    LOG_INFO  = 1,
    LOG_WARN  = 2,
    LOG_ERROR = 3,
} LogLevel;

/**
 * Initialise le logger.
 * @param level     Niveau minimum de log à afficher.
 * @param log_file  Fichier de sortie (NULL = stderr).
 */
void logger_init(LogLevel level, FILE *log_file);

/**
 * Écrit un message de log.
 * @param level     Niveau du message.
 * @param file      Fichier source (__FILE__).
 * @param line      Ligne source (__LINE__).
 * @param fmt       Format printf.
 * @param ...       Arguments.
 */
void logger_log(LogLevel level, const char *file, int line,
                const char *fmt, ...);

/** Macros de commodité */
#define LOG_DEBUG(...) logger_log(LOG_DEBUG, __FILE__, __LINE__, __VA_ARGS__)
#define LOG_INFO(...)  logger_log(LOG_INFO,  __FILE__, __LINE__, __VA_ARGS__)
#define LOG_WARN(...)  logger_log(LOG_WARN,  __FILE__, __LINE__, __VA_ARGS__)
#define LOG_ERROR(...) logger_log(LOG_ERROR, __FILE__, __LINE__, __VA_ARGS__)

#endif /* SMARTSTUDY_UTILS_LOGGER_H */
