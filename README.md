# DarkMedia Workflow AI

Application web React + Supabase pour créer, conserver, rechercher et réutiliser des workflows IA privés.

## Fonctionnalités

- Authentification email/mot de passe Supabase.
- CRUD de workflows IA par utilisateur avec Row Level Security.
- Recherche globale, tri, catégories, tags et favoris.
- UI dark inspirée de la référence fournie.
- Mode démo local si les variables Supabase ne sont pas encore configurées.

## Démarrage

```bash
npm install
cp .env.example .env
npm run dev
```

Renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` dans `.env`.

## Déploiement Supabase

1. Crée un projet Supabase.
2. Dans SQL Editor, exécute `supabase/schema.sql`.
3. Active le provider Email dans Authentication.
4. Déploie le front sur Vercel, Netlify, GitHub Pages ou Supabase Hosting en exposant les deux variables `VITE_*`.

## Build

```bash
npm run build
```
