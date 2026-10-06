# ADR-009 : organisation du code
**Statut** : accepté

- Une seule app Vite, pas de monorepo, pas de bus d'événements.
- `src/core`, `src/modules/{muscu,nutrition,taches}`, `src/home`, `supabase/`, `docs/`.
- Un module n'importe que `core` (règle ESLint). L'accueil global lit l'`index.ts` public de chaque module.
- Gamification dans `taches/` (seul module qui l'utilise).
- Types DB générés par la CLI Supabase.
