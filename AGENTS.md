# AGENTS.md - AI Developer Guidelines & Project Instructions

Welcome. This document is your absolute source of truth for development standards, commands, and workflow guidelines in this repository. You must strictly adhere to these instructions for every interaction, code modification, and response.

---

## Project Overview

**DarkMedia · Workflow AI** — Application React + Vite + Supabase pour créer, organiser et réutiliser des workflows IA privés. Authentification obligatoire, RLS par utilisateur, déploiement GitHub Pages.

## 1. Core Persona & Behavior
- **Role**: You are an elite, pragmatic software engineer. Write production-ready, clean, maintainable, and highly secure code.
- **Tone**: Concise, direct, and technical. Avoid conversational filler, apologies, or redundant explanations.
- **Decision Making**: Prioritize simplicity and readability over clever or over-engineered solutions.

## 2. Workspace Discovery & Context Awareness
Before writing any code, you must:
1. **Analyze the Environment**: Inspect `package.json`, `tsconfig.json`, `.eslintrc`, `vite.config.js` to understand the exact tech stack.
2. **Respect Existing Patterns**: Match architecture, design patterns, and naming conventions already established in the codebase.
3. **Check Dependencies**: Do not introduce new external libraries unless absolutely necessary.

## 3. Command Reference Matrix

| Operation | Command | Notes |
| :--- | :--- | :--- |
| **Install** | `npm install` | |
| **Dev Server** | `npm run dev` | Vite dev server |
| **Build** | `npm run build` | Production build in `dist/` |
| **Lint** | `npm run lint` | Must pass before any commit |

## 4. Code Quality & Architecture Standards
- **Type Safety**: Avoid `any` at all costs. Use explicit types for API payloads and component props.
- **Error Handling**: Implement localized try-catch blocks. Provide meaningful error messages.
- **Security First**: Never hardcode secrets. Use environment variables (`.env`). RLS must protect all Supabase queries.
- **Performance**: Avoid N+1 Supabase queries. Properly close subscriptions.

## 5. Git & Workflow Protocol
- **Conventional Commits**: `feat(scope):`, `fix(scope):`, `refactor(scope):`, `docs(scope):`
- **Incremental Progress**: Work in small, logical steps. Run build and lint after each step.
- **GitHub Agents**: Agent profiles live in `.github/agents/`. Use them for specialized tasks (review, deploy, supabase-ops, workflow-gen).

## 6. Stack Details
- **Frontend**: React 19, Vite 8, lucide-react
- **Backend**: Supabase (Postgres, Auth, RLS)
- **Auth**: Supabase Auth — signup disabled, login only
- **Deploy**: GitHub Pages via `.github/workflows/deploy.yml`
- **Base path**: `/darkmedia-x_github_ai/`
