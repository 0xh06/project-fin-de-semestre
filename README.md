# SmartStudy AI

[![Backend CI](https://github.com/0xh06/project-fin-de-semestre/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/0xh06/project-fin-de-semestre/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/0xh06/project-fin-de-semestre/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/0xh06/project-fin-de-semestre/actions/workflows/frontend-ci.yml)

Application d'étude intelligente combinant analyse PDF, chat IA, révision adaptative,
suivi de progression et mind-mapping — écrite en **C**.

## Architecture

```
smartstudy-ai/
├── include/           # En-têtes publics (.h), organisés par module
│   ├── core/          # Noyau applicatif : config, gestion d'erreurs, cycle de vie
│   ├── db/            # Couche d'accès SQLite : modèles, migrations, requêtes
│   ├── api/           # Clients REST vers les API IA (OpenAI, Gemini, Mistral)
│   ├── pdf/           # Extraction et analyse de documents PDF
│   ├── chat/          # Moteur de conversation IA contextuel
│   ├── review/        # Révision intelligente : flashcards, quiz, répétition espacée
│   ├── progress/      # Suivi et analytics de progression utilisateur
│   ├── mindmap/       # Génération et manipulation de cartes mentales
│   └── utils/         # Utilitaires transversaux : JSON, strings, logging
│
├── src/               # Implémentations (.c), même arborescence que include/
│   ├── main.c         # Point d'entrée de l'application
│   ├── core/          # Implémentation du noyau
│   ├── db/            # Implémentation couche données
│   ├── api/           # Implémentation clients API
│   ├── pdf/           # Implémentation parsing PDF
│   ├── chat/          # Implémentation moteur de chat
│   ├── review/        # Implémentation modules de révision
│   ├── progress/      # Implémentation tracking
│   ├── mindmap/       # Implémentation mind-mapping
│   └── utils/         # Implémentation utilitaires
│
├── tests/             # Tests unitaires (Unity framework), un fichier par module
├── lib/               # Dépendances tierces embarquées (cJSON, sqlite3)
├── data/              # Schéma SQL, fichiers de seed, assets
├── docs/              # Documentation technique et utilisateur
├── scripts/           # Scripts de build, déploiement, CI
├── build/             # Répertoire de sortie (généré par make)
├── Makefile           # Build system : all, test, clean, lint
└── .gitignore
```

## Dépendances

| Librairie | Rôle                        | Intégration     |
|-----------|-----------------------------|-----------------|
| SQLite3   | Base de données locale      | Embarquée (lib/)|
| cJSON     | Parsing/génération JSON     | Embarquée (lib/)|
| libcurl   | Requêtes HTTP REST          | Système         |
| Unity     | Framework de tests unitaires| Embarquée (lib/)|
| libpoppler| Extraction texte PDF        | Système         |

## Build

```bash
make all        # Compile l'application
make test       # Compile et exécute les tests unitaires
make clean      # Nettoie les artefacts de build
make lint       # Analyse statique (cppcheck)
make run        # Compile et exécute l'application
```

## Configuration

Copiez `.env.example` vers `.env` et renseignez vos clés API :

```
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=http://localhost:8080
JWT_SECRET=change_me
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GEMINI_API_KEY=AIza...
SMARTSTUDY_DB_PATH=./data/smartstudy.db
```


## Frontend Web

Le frontend Next.js se trouve dans `frontend/`.

```bash
npm install
npm run dev:web
```

Le backend C écoute par défaut sur `http://localhost:8080` et le frontend sur `http://localhost:3000`.

## OAuth GitHub et Google

Le projet supporte déjà `GitHub` et `Google` côté backend et frontend.

- `GitHub callback` : `http://localhost:8080/api/auth/github/callback`
- `Google callback` : `http://localhost:8080/api/auth/google/callback`
- `Frontend callback` : `http://localhost:3000/callback`

Sans `GITHUB_CLIENT_ID` ou `GOOGLE_CLIENT_ID`, le backend utilise un mode de démonstration local.
Si le backend n'est pas démarré, le frontend affiche maintenant une erreur claire au lieu de rediriger vers une URL cassée.
## Licence

MIT
