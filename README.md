# DarkMedia Workflow AI

Application React + Supabase pour créer, conserver, rechercher et réutiliser des workflows IA privés.

## Fonctionnalités

- CRUD complet de workflows : titre, description, contenu, catégorie, modèle, tags et favoris.
- Recherche instantanée, filtres par catégorie/tag/favori et tri par date ou utilisation.
- Copie en un clic avec compteur d’utilisation.
- Structuration locale de notes et ajout de consignes d’amélioration.
- Mode local persistant, utilisable immédiatement sans service externe.
- Authentification email/mot de passe et synchronisation Supabase optionnelles.
- Isolation des données par utilisateur avec Row Level Security (RLS).
- Interface responsive, navigation mobile, raccourci `Ctrl/Cmd + K` et contrôles accessibles.

## Prérequis

- Node.js 20.19 ou plus récent.
- npm 10 ou plus récent.
- Un projet Supabase uniquement si la synchronisation cloud est souhaitée.

## Démarrage local

```bash
npm install
npm run dev
```

L’application démarre en mode local. Les workflows sont conservés dans le `localStorage` du navigateur.

## Activer Supabase

1. Crée un projet sur Supabase.
2. Ouvre le SQL Editor et exécute [`supabase/schema.sql`](supabase/schema.sql). Le script est rejouable.
3. Dans Authentication, active le fournisseur Email.
4. Copie `.env.example` vers `.env`.
5. Remplace les valeurs d’exemple par l’URL du projet et la clé publique `anon` :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

6. Redémarre le serveur de développement.

Ne place jamais la clé `service_role` dans le front-end. Les variables `VITE_*` sont intégrées au navigateur et doivent uniquement contenir des valeurs publiques.

## Commandes

```bash
npm run dev      # serveur de développement
npm run lint     # contrôle ESLint
npm run build    # build de production dans dist/
npm run preview  # prévisualisation du build
```

## Déploiement

Le dossier est une application Vite standard et peut être déployé sur Vercel, Netlify, GitHub Pages ou tout hébergement statique. Si Supabase est activé, ajoute les deux variables `VITE_*` dans les paramètres du fournisseur de déploiement.

Pour une SPA servie sous un sous-chemin (par exemple GitHub Pages), configure au besoin l’option `base` de Vite avant le build.
