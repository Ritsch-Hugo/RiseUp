# APP 3 en 1 — contexte pour Claude Code

App perso (un seul utilisateur : Hugo) qui regroupe 3 modules : **Muscu**, **Nutrition**, **Tâches** (gamifiées). PWA, téléphone Android d'abord, PC ensuite, même code. Budget 0 €. Repo public.

## Manière de travailler
- Hugo avance **étape par étape** et valide chaque étape avant la suivante. Ne pas enchaîner plusieurs features d'un coup.
- Réponses en français informel, concises, directes.
- Suivre le plan de `docs/plan.md`. Toute décision qui contredit un ADR → demander à Hugo, puis écrire un nouvel ADR.
- Si une info manque (règle, écran) : demander, ne pas inventer.

## Stack (voir `docs/adr/`)
- React + Vite + TypeScript strict. TanStack Query pour les données serveur.
- Supabase : Postgres, Auth, Storage, Edge Functions, pg_cron. Cloud-first (connexion requise).
- Hébergement Cloudflare Pages, CI GitHub Actions, tests Vitest.

## Organisation
```
src/core/        client Supabase, auth, routeur, UI de base (charte), utils
src/modules/     muscu/ nutrition/ taches/   (chacun : écrans, composants, hooks, requêtes, config.ts, index.ts)
src/home/        accueil global
supabase/        migrations/ seed/ functions/
docs/            ADR, schéma, règles métier, plan
```
- Un module importe `core`, **jamais un autre module** (règle ESLint). L'accueil global passe par l'`index.ts` public de chaque module.
- Pas de bus d'événements, pas de monorepo.
- Types DB générés : `supabase gen types typescript` → ne pas écrire les types de tables à la main.

## Conventions de données (ADR-004)
- Tables préfixées `muscu_`, `nutri_`, `taches_` dans `public`.
- Chaque table : `id uuid` (généré côté client avec `crypto.randomUUID()`), `user_id uuid default auth.uid()`, `created_at`, `updated_at` (trigger).
- **RLS activée sur chaque table** avec `user_id = auth.uid()`, dans la même migration que la création de la table. Non négociable.
- Jamais la clé `service_role` dans le front.
- Suppression réelle par défaut ; `archived_at` pour ce qui est référencé par l'historique (exercices, aliments, habitudes).
- Unités : kg, secondes, valeurs nutritionnelles pour 100 g. Événements en `timestamptz`, jours en `day date` (heure de Paris). Semaine = lundi → dimanche.
- Rien de dérivé n'est stocké (volume, 1RM, stats, streaks) → vues / fonctions SQL. Exceptions : valeurs nutritionnelles copiées dans le journal, XP figé dans le journal d'XP.
- Mises à jour optimistes ; brouillon de la séance en cours en local.

## Règles métier
Toutes dans `docs/regles-metier.md`. Les chiffres sont des **constantes** dans `src/modules/<module>/config.ts`, jamais en dur dans les composants. Chaque règle = fonction pure + tests Vitest.

## Design
- Référence : canvas Claude https://claude.ai/artifact/C2MFJZBdG9PmQ7o4Qibh2j (tous les écrans). Figma : ne pas compter dessus (quota MCP épuisé).
- Charte : fond `#05070D`, carte `#0C111D`, carte 2 `#151D30`, texte `#EAF0FF`, texte secondaire `#9AA6C0`, accent `#2F7BFF` (bouton plein `#2A6CF0`), accent 2 `#38D0FF`, positif `#3DDC97`, danger `#FF5C6C`. Police DM Sans. Rayons : cartes 20 px, boutons 16 px. Macros : protéines cyan, glucides `#9D8CFF`, lipides vert.
- Les chiffres des maquettes sont des exemples.
- Écrans manquants (fin de séance, choix d'exercices, historique, calendrier, etc.) : les proposer dans la charte, Hugo valide sur capture.

## Pièges connus
- Vitest en CI sans `.env.local` : un test ne doit pas importer le client Supabase (`core/supabase.ts` lève une erreur). Séparer la logique pure (testée) de l'accès base. Vérifier en déplaçant `.env.local` avant de pousser.
- `docs/` est dans `.gitignore` : les nouveaux fichiers se commitent avec `git add -f`.
- Les secrets (VAPID, cron) ne vont jamais dans le dépôt ; voir ADR-018. Les migrations sont appliquées par la CI au push sur `main`, puis `supabase gen types`.

## Commandes (à compléter au setup)
- `npm run dev` / `npm run build` / `npm run lint` / `npm run typecheck` / `npm test`
- `supabase db push` (migrations), `supabase gen types typescript --linked > src/core/db.types.ts`

## Docs
- `docs/produit.md` : périmètre fonctionnel
- `docs/adr/` : décisions (001 → 018)
- `docs/schema.md` : tables
- `docs/regles-metier.md` : calculs chiffrés
- `docs/plan.md` : phases, backlog
