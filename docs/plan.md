# Plan de développement

Estimations en sessions d'environ 2 h avec Claude Code, indicatives. Hugo valide chaque étape.

## Phase 0 : socle (~4 sessions)
- [x] Repo Vite + React + TS strict, ESLint (isolation des modules), Prettier, Vitest
- [x] Projet Supabase + CLI, migration initiale (trigger `updated_at`, modèle RLS), inscriptions désactivées, compte de Hugo
- [ ] Login, routeur, layout à onglets, thème (charte + DM Sans), composants de base (carte, bouton, feuille)
- [ ] PWA installable (manifest, icônes)
- [ ] CI GitHub Actions, Cloudflare Pages, cron anti-pause

## Phase 1 : Muscu (~12 sessions)
- [ ] Schéma + seed ~100 exercices traduits + images
- [ ] Bibliothèque (10 groupes), fiche exercice, création d'exercice + upload photo
- [ ] Programmes et séances types
- [ ] Séance en cours : feuille, saisie, minuteur, chrono, brouillon local, fin de séance
- [ ] Règles métier + tests (1RM, records, volume, récup, muscles, streak)
- [ ] Accueil Muscu, profil (graphes, silhouette SVG, calendrier, stats avancées)
- **Jalon : 1 à 2 semaines d'usage réel en salle avant la phase 2.**

## Phase 2 : Nutrition (~8 sessions)
- [ ] Schéma, journal, navigation par jour, anneaux
- [ ] Recherche + Open Food Facts, scan, fiche et création d'aliment, favoris, récents
- [ ] Repas enregistrés, « Copier hier », eau
- [ ] Objectifs datés, stats, streak + tests

## Phase 3 : Tâches (~12 sessions)
- [ ] Schéma, tâches, catégories, récurrence, Aujourd'hui / À venir
- [ ] Habitudes, pauses, logs, routine du jour
- [ ] Journal d'XP, niveaux, rangs, anti-triche, écran de récompense + tests
- [ ] Quêtes perso (types, reconduction), boss, badges, récompenses perso
- [ ] Notifications push (pg_cron + Edge Function + Web Push)

## Phase 4 : finitions (~3 sessions)
- [ ] Accueil global (résumés des 3 modules)
- [ ] Export / import JSON
- [ ] États vides, écrans de détail restants

**Total : ~40 sessions.**

## Écrans à concevoir pendant le dev
Fin de séance, choix d'exercices, historique + détail de séance, calendrier, passage de niveau, stats nutrition 30 j / 3 mois, suppression de tâche, création de récompense, états vides, ajout des groupes Fessiers et Mollets. → Proposés dans la charte, validés sur capture.

## Backlog
- **Sécurité** : voir ADR-008.
- **Tests** : composants, E2E Playwright.
- **Récupération** : affiner avec le RPE.
