# ==========================================
# Build Stage
# ==========================================
FROM alpine:3.19 AS builder

# Installer les dépendances de compilation (C, CMake, SQLite, Curl, OpenSSL)
RUN apk add --no-cache \
    build-base \
    cmake \
    sqlite-dev \
    curl-dev \
    openssl-dev

# Préparer le dossier de build
WORKDIR /app
COPY . .

# Construire l'application
RUN cmake -B build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build build --config Release

# ==========================================
# Run Stage
# ==========================================
FROM alpine:3.19

# Installer les librairies d'exécution
RUN apk add --no-cache \
    sqlite-libs \
    libcurl \
    openssl

WORKDIR /app

# Copier le binaire depuis le build stage
COPY --from=builder /app/build/smartstudy /app/smartstudy

# Préparer le dossier pour la base de données SQLite (volume persistant)
RUN mkdir -p /data
ENV SMARTSTUDY_DB_PATH=/data/smartstudy.db

# Exposer le port du serveur HTTP
EXPOSE 8080

# Variables d'environnement par défaut
ENV PORT=8080

# Lancer le serveur
CMD ["./smartstudy"]
