/**
 * @file string_utils.h
 * @brief Utilitaires de manipulation de chaînes de caractères.
 *
 * Fonctions complémentaires à la bibliothèque standard pour
 * le trimming, la duplication sécurisée, le split, etc.
 */

#ifndef SMARTSTUDY_UTILS_STRING_UTILS_H
#define SMARTSTUDY_UTILS_STRING_UTILS_H

#include <stddef.h>

/**
 * Duplique une chaîne de manière sécurisée.
 * @param str  Chaîne à dupliquer (peut être NULL).
 * @return Copie allouée ou NULL.
 */
char *str_dup(const char *str);

/**
 * Supprime les espaces en début et fin de chaîne (in-place).
 * @param str  Chaîne à trimmer.
 * @return Pointeur vers le début du contenu trimmé (dans la même allocation).
 */
char *str_trim(char *str);

/**
 * Vérifie si une chaîne est NULL ou vide.
 * @param str  Chaîne à tester.
 * @return 1 si NULL ou vide, 0 sinon.
 */
int str_is_empty(const char *str);

/**
 * Concatène deux chaînes dans un nouveau buffer alloué.
 * @param a  Première chaîne.
 * @param b  Seconde chaîne.
 * @return Chaîne concaténée (à free).
 */
char *str_concat(const char *a, const char *b);

/**
 * Tronque une chaîne à max_len caractères + "..." si trop longue.
 * @param str      Chaîne source.
 * @param max_len  Longueur max avant troncature.
 * @return Chaîne tronquée (allouée, à free).
 */
char *str_truncate(const char *str, size_t max_len);

#endif /* SMARTSTUDY_UTILS_STRING_UTILS_H */
