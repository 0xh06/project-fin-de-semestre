# ============================================================================
#  SmartStudy AI — Makefile
#  Build system pour le projet C avec SQLite, cJSON, libcurl
# ============================================================================

# --- Toolchain ---
CC        := gcc
CFLAGS    := -Wall -Wextra -Wpedantic -std=c11 -g
LDFLAGS   :=
LDLIBS    := -lsqlite3 -lcurl -lm -lpthread

# --- Répertoires ---
SRC_DIR   := src
INC_DIR   := include
LIB_DIR   := lib
TEST_DIR  := tests
BUILD_DIR := build
OBJ_DIR   := $(BUILD_DIR)/obj
BIN_DIR   := $(BUILD_DIR)/bin
TEST_BIN  := $(BUILD_DIR)/test_runner

# --- Includes ---
# include/ pour nos headers, lib/ pour les dépendances embarquées
INCLUDES  := -I$(INC_DIR) -I$(LIB_DIR)

# --- Sources applicatives (tout src/**/*.c sauf main.c pour les tests) ---
APP_SRCS  := $(shell find $(SRC_DIR) -name '*.c')
MAIN_SRC  := $(SRC_DIR)/main.c
LIB_SRCS  := $(filter-out $(MAIN_SRC), $(APP_SRCS))

# --- Sources des dépendances embarquées ---
VENDOR_SRCS := $(LIB_DIR)/cJSON/cJSON.c

# --- Sources de tests ---
TEST_SRCS := $(shell find $(TEST_DIR) -name '*.c')

# --- Objets ---
APP_OBJS    := $(patsubst %.c, $(OBJ_DIR)/%.o, $(APP_SRCS))
LIB_OBJS    := $(patsubst %.c, $(OBJ_DIR)/%.o, $(LIB_SRCS))
VENDOR_OBJS := $(patsubst %.c, $(OBJ_DIR)/%.o, $(VENDOR_SRCS))
TEST_OBJS   := $(patsubst %.c, $(OBJ_DIR)/%.o, $(TEST_SRCS))

# --- Binaire final ---
TARGET    := $(BIN_DIR)/smartstudy

# ============================================================================
#  TARGETS
# ============================================================================

.PHONY: all test clean lint run dirs

## all : Compile l'application complète
all: dirs $(TARGET)
	@echo "✅ Build terminé : $(TARGET)"

## run : Compile et exécute l'application
run: all
	@echo "🚀 Lancement de SmartStudy AI..."
	@$(TARGET)

## test : Compile et exécute tous les tests unitaires
test: dirs $(TEST_BIN)
	@echo "🧪 Exécution des tests unitaires..."
	@$(TEST_BIN)
	@echo "✅ Tous les tests sont passés."

## clean : Supprime tous les artefacts de build
clean:
	@echo "🧹 Nettoyage..."
	@rm -rf $(BUILD_DIR)
	@echo "✅ Clean terminé."

## lint : Analyse statique du code source avec cppcheck
lint:
	@echo "🔍 Analyse statique (cppcheck)..."
	@cppcheck --enable=all --inconclusive --std=c11 \
		-I$(INC_DIR) -I$(LIB_DIR) \
		--suppress=missingIncludeSystem \
		--quiet $(SRC_DIR)
	@echo "✅ Lint terminé."

## dirs : Crée l'arborescence de build
dirs:
	@mkdir -p $(BIN_DIR)
	@mkdir -p $(OBJ_DIR)/$(SRC_DIR)
	@find $(SRC_DIR) -type d -exec mkdir -p $(OBJ_DIR)/{} \;
	@mkdir -p $(OBJ_DIR)/$(LIB_DIR)/cJSON
	@mkdir -p $(OBJ_DIR)/$(TEST_DIR)

# ============================================================================
#  LINKING
# ============================================================================

# Binaire principal : tous les .o applicatifs + vendor
$(TARGET): $(APP_OBJS) $(VENDOR_OBJS)
	$(CC) $(LDFLAGS) -o $@ $^ $(LDLIBS)

# Binaire de tests : objets lib (sans main) + vendor + tests + Unity
$(TEST_BIN): $(LIB_OBJS) $(VENDOR_OBJS) $(TEST_OBJS) $(OBJ_DIR)/$(LIB_DIR)/unity/unity.o
	$(CC) $(LDFLAGS) -o $@ $^ $(LDLIBS)

# ============================================================================
#  COMPILATION
# ============================================================================

# Règle générique : .c -> .o
$(OBJ_DIR)/%.o: %.c
	$(CC) $(CFLAGS) $(INCLUDES) -I$(LIB_DIR)/unity -MMD -MP -c $< -o $@

# Unity (framework de test)
$(OBJ_DIR)/$(LIB_DIR)/unity/unity.o: $(LIB_DIR)/unity/unity.c
	@mkdir -p $(OBJ_DIR)/$(LIB_DIR)/unity
	$(CC) $(CFLAGS) -I$(LIB_DIR)/unity -c $< -o $@

# Inclusion des fichiers de dépendances générés (-MMD)
-include $(APP_OBJS:.o=.d) $(TEST_OBJS:.o=.d) $(VENDOR_OBJS:.o=.d)

# ============================================================================
#  AIDE
# ============================================================================

## help : Affiche cette aide
help:
	@echo "SmartStudy AI — Targets disponibles :"
	@echo "  make all    — Compile l'application"
	@echo "  make test   — Compile et lance les tests"
	@echo "  make run    — Compile et exécute"
	@echo "  make clean  — Supprime les artefacts"
	@echo "  make lint   — Analyse statique (cppcheck)"
	@echo "  make help   — Affiche cette aide"
