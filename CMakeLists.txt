cmake_minimum_required(VERSION 3.10)
project(SmartStudyAI C)

# ==============================================================================
# 1. Configuration et Flags de compilation
# ==============================================================================
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Ajout des flags demandés : -Wall -Wextra -Werror -g -O2
if (CMAKE_COMPILER_IS_GNUCC OR CMAKE_C_COMPILER_ID MATCHES "Clang")
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -Wall -Wextra -Werror -g -O2")
elseif (MSVC)
    # Équivalent des flags pour le compilateur Microsoft Visual C++
    set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} /W4 /WX /Zi /O2")
endif()

# ==============================================================================
# 2. Répertoires d'inclusion
# ==============================================================================
# On indique à CMake où trouver nos headers (.h) et les librairies embarquées
include_directories(
    ${CMAKE_SOURCE_DIR}/include
    ${CMAKE_SOURCE_DIR}/lib
)

# ==============================================================================
# 3. Dépendances système (libcurl et sqlite3)
# ==============================================================================
# CMake cherche les librairies installées sur ton système
find_package(CURL REQUIRED)
include_directories(${CURL_INCLUDE_DIRS})

find_package(SQLite3 REQUIRED)
include_directories(${SQLite3_INCLUDE_DIRS})

find_package(OpenSSL REQUIRED)
include_directories(${OPENSSL_INCLUDE_DIR})

# ==============================================================================
# 4. Gestion des sources
# ==============================================================================
# cJSON et Mongoose sont compilés directement avec notre code
set(CJSON_SOURCES ${CMAKE_SOURCE_DIR}/lib/cJSON/cJSON.c)
set(MONGOOSE_SOURCES ${CMAKE_SOURCE_DIR}/lib/mongoose/mongoose.c)

# On récupère tous nos fichiers .c (sauf le main.c qu'on sépare pour les tests)
file(GLOB_RECURSE APP_SOURCES "${CMAKE_SOURCE_DIR}/src/*.c")
list(REMOVE_ITEM APP_SOURCES "${CMAKE_SOURCE_DIR}/src/main.c")

# ==============================================================================
# 5. Target Principal : L'application finale
# ==============================================================================
add_executable(smartstudy 
    ${CMAKE_SOURCE_DIR}/src/main.c 
    ${APP_SOURCES} 
    ${CJSON_SOURCES}
    ${MONGOOSE_SOURCES}
)

# Liaison avec curl, sqlite3, openssl et le module mathématique natif (m)
if(UNIX)
    target_link_libraries(smartstudy ${CURL_LIBRARIES} ${SQLite3_LIBRARIES} ${OPENSSL_CRYPTO_LIBRARY} m)
else()
    target_link_libraries(smartstudy ${CURL_LIBRARIES} ${SQLite3_LIBRARIES} ${OPENSSL_CRYPTO_LIBRARY} ws2_32)
endif()

# ==============================================================================
# 6. Target Secondaire : Les tests unitaires (avec Unity)
# ==============================================================================
# On récupère le code de Unity et nos fichiers de tests
set(UNITY_SOURCES ${CMAKE_SOURCE_DIR}/lib/unity/unity.c)
file(GLOB_RECURSE TEST_SOURCES "${CMAKE_SOURCE_DIR}/tests/*.c")

# L'exécutable de test inclut la logique métier (APP_SOURCES), les dépendances et les tests
add_executable(smartstudy_tests 
    ${TEST_SOURCES} 
    ${APP_SOURCES} 
    ${CJSON_SOURCES} 
    ${UNITY_SOURCES}
)

if(UNIX)
    target_link_libraries(smartstudy_tests ${CURL_LIBRARIES} ${SQLite3_LIBRARIES} m)
else()
    target_link_libraries(smartstudy_tests ${CURL_LIBRARIES} ${SQLite3_LIBRARIES})
endif()

# On active le support de CTest pour pouvoir lancer "ctest" dans le terminal
enable_testing()
add_test(NAME AllTests COMMAND smartstudy_tests)
