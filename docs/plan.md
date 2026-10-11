# Plan de développement

Estimations en sessions d'environ 2 h avec Claude Code, indicatives. Hugo valide chaque étape.

## Phase 0 : socle (~4 sessions)
- [x] Repo Vite + React + TS strict, ESLint (isolation des modules), Prettier, Vitest
- [x] Projet Supabase + CLI, migration initiale (trigger `updated_at`, modèle RLS), inscriptions désactivées, compte de Hugo
- [x] Login, routeur, layout à onglets, thème (charte + DM Sans), composants de base (carte, bouton, feuille)
- [x] PWA installable (manifest, icônes)
- [x] CI GitHub Actions, Cloudflare Pages, cron anti-pause

## Phase 1 : Muscu (~12 sessions)
- [x] Schéma + seed ~100 exercices traduits + images
- [x] Bibliothèque (10 groupes), fiche exercice, création d'exercice + upload photo
- [x] Programmes et séances types
- [x] Séance en cours : feuille, saisie, minuteur, chrono, brouillon local, fin de séance
- [x] Règles métier + tests (1RM, records, volume, récup, muscles, streak)
- [x] Accueil Muscu, profil (graphes, silhouette SVG, calendrier, stats avancées), historique, prochaine séance
- [ ] Reste : glisser-déposer pour réordonner, derniers calculs côté client à passer en SQL (fiche exercice, résumé de séance, profil)
- **Jalon : 1 à 2 semaines d'usage réel en salle avant la phase 2.**

## Phase 2 : Nutrition (~8 sessions)
- [x] Schéma, journal, navigation par jour, anneaux
- [x] Recherche + Open Food Facts, scan, fiche et création d'aliment, favoris, récents
- [x] Repas enregistrés, « Copier hier », eau
- [x] Objectifs datés, stats, streak + tests

## Phase 3 : Tâches (~12 sessions)
- [x] Schéma, tâches, catégories, récurrence, Aujourd'hui / À venir
- [x] Habitudes, pauses, logs, routine du jour
- [x] Journal d'XP, niveaux, rangs, anti-triche, écran de récompense + tests
- [x] Quêtes perso (types, reconduction)
- [x] Boss, badges, récompenses perso
- [x] Notifications push (pg_cron + Edge Function + Web Push)

## Phase 4 : finitions (~3 sessions)
- [x] Accueil global (résumés des 3 modules)
- [x] Export / import JSON
- [x] États vides, écrans de détail restants

**Total : ~40 sessions.**

## Écrans à concevoir pendant le dev
Fin de séance, choix d'exercices, historique + détail de séance, calendrier, passage de niveau, stats nutrition 30 j / 3 mois, suppression de tâche, création de récompense, états vides, ajout des groupes Fessiers et Mollets. → Proposés dans la charte, validés sur capture.

## Backlog
- **Sécurité** : voir ADR-008.
- **Tests** : composants, E2E Playwright.
- **Récupération** : affiner avec le RPE.

## État au 11 octobre 2026
- Phases 1, 2 et 3 (étapes 1 à 5) codées, poussées, CI verte. **Rien n'est encore validé sur téléphone par Hugo.**
- À faire ensuite : validation sur tel des 3 modules, jalon d'usage réel en salle (phase 1), puis phase 3 étape 6 (boss, badges, récompenses perso) et étape 7 (notifications push), puis phase 4.
- Écrans proposés par Claude (absents des maquettes, à valider sur capture) : historique Muscu, création de quête, fin de séance/récompense déjà validée côté Muscu.
