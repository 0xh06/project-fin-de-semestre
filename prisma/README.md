# Prisma + Supabase

Prisma est installé pour utiliser la base Postgres de Supabase côté serveur/CLI.

## Variables nécessaires

Crée un fichier `.env` à la racine du projet `smartstudy-ai/` avec :

```env
# Runtime Prisma: utilise la connexion poolée Supabase (PgBouncer, port 6543)
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Migrations Prisma: utilise la connexion directe Supabase (port 5432)
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

Dans Supabase :

- `DATABASE_URL` : Project Settings → Database → Connection string → **Transaction pooler**
- `DIRECT_URL` : Project Settings → Database → Connection string → **Direct connection**

⚠️ Ne mets jamais ces URLs dans le frontend ni en `NEXT_PUBLIC_*`.

## Commandes

```bash
npm run prisma:format
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:studio
```

## Notes Supabase

- Prisma ne remplace pas Supabase Auth côté client.
- Le schéma Prisma crée les tables applicatives (`users`, `documents`, `flashcards`, etc.).
- Si tu veux utiliser `auth.users` de Supabase comme source d'identité, on pourra ensuite adapter le modèle `User` pour stocker `auth_user_id UUID` au lieu d'un `id BigInt` classique.
