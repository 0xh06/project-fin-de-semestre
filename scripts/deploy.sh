#!/bin/bash
# ============================================================================
# SmartStudy AI — Script de déploiement (Railway / Render)
# ============================================================================

set -e

echo "🚀 Préparation du déploiement de SmartStudy AI..."

# Vérification des variables essentielles
if [ -z "$JWT_SECRET" ]; then
    echo "⚠️  ATTENTION: JWT_SECRET n'est pas défini dans l'environnement !"
    echo "Génère une clé secrète avec : openssl rand -base64 32"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  ATTENTION: Aucune clé d'API IA n'est définie !"
fi

# Option 1: Déploiement Railway (nécessite la CLI `railway`)
if command -v railway &> /dev/null; then
    echo "🚄 Déploiement via Railway CLI détecté..."
    railway up --detach
    echo "✅ Déploiement Railway initié."
    exit 0
fi

# Option 2: Déploiement classique Docker Compose (sur VPS/Render)
if command -v docker-compose &> /dev/null; then
    echo "🐳 Démarrage via Docker Compose..."
    docker-compose -f docker-compose.yml up -d --build
    echo "✅ Déploiement Docker terminé."
    exit 0
fi

echo "❌ Aucun outil de déploiement (Railway ou Docker Compose) trouvé."
echo "Pour Render, connectez votre repo GitHub au service Render et le Dockerfile sera détecté automatiquement."
exit 1
