/**
 * @file db_factory.h
 * @brief Factory pour sélectionner l'implémentation de la base de données.
 */

#ifndef SMARTSTUDY_DB_FACTORY_H
#define SMARTSTUDY_DB_FACTORY_H

#include "db/db_interface.h"

/**
 * Retourne le pointeur vers l'interface de base de données active.
 * Se base sur la variable d'environnement DB_MODE (LOCAL ou REMOTE).
 */
DBInterface* db_get_interface(void);

#endif /* SMARTSTUDY_DB_FACTORY_H */
