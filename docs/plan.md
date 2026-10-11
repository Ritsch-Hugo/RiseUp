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

**Total : ~40 sessions** (plus le polish).

## Écrans à concevoir pendant le dev
Fin de séance, choix d'exercices, historique + détail de séance, calendrier, passage de niveau, stats nutrition 30 j / 3 mois, suppression de tâche, création de récompense, états vides, ajout des groupes Fessiers et Mollets. → Proposés dans la charte, validés sur capture.

## Backlog
- **Sécurité** : voir ADR-008.
- **Tests** : composants, E2E Playwright.
- **Récupération** : affiner avec le RPE.

## Polish visuel (hors plan initial, demandé par Hugo le 11 oct.)
Retour de Hugo après test sur tel : « tout est à peu près ok mais ça fait encore projet perso ».
- [x] Base commune : animations (changement d'écran, feuilles, barres, cases), retour tactile, squelettes de chargement, vibrations
- [x] Accueil (salutation, halo, cartes en dégradé, anneaux de progression, données dans une feuille)
- [x] Tâches : écran Aujourd'hui (carte de niveau héros, bande de priorité, surfaces)
- [x] Muscu : séance en cours (en-tête live, stats, minuteur de repos héros, exercices en cartes)
- [ ] Nutrition : journal (anneaux, créneaux, eau)
- [ ] Harmoniser les autres écrans avec `--surface` / `--shadow-card` : Tâches (À venir, Quêtes, Progrès, détail, formulaires), Muscu (accueil, bibliothèque, programmes, profil, historique, résumé de séance), Nutrition (aliments, repas, stats, objectifs), connexion
- [ ] Éventuel : écran de démarrage (splash), glisser pour supprimer, pull-to-refresh

## État au 11 octobre 2026 (fin de session)
- **Les 4 phases du plan sont codées, poussées, CI verte.**
- Hugo a testé sur téléphone (PWA installée) : fonctionnel dans l'ensemble, d'où le polish ci-dessus. Les retours détaillés (bugs précis) restent à collecter au fil de l'usage.
- **À faire ensuite, dans l'ordre :**
  1. Poursuivre le polish (journal Nutrition, puis harmonisation des écrans restants).
  2. Valider sur tel les ajouts récents : boss, badges, récompenses, notifications push (essai + vrai rappel), export puis réimport du même fichier (l'aperçu doit afficher « 0 ligne à ajouter »).
  3. Jalon d'usage réel en salle (phase 1).
  4. Trancher deux définitions : « taux de réussite » (Progrès) et exclusion des tâches récurrentes de l'anti-triche.
  5. Confirmer les cases validées en vert (ou revenir au bleu de la maquette).
- Écrans proposés par Claude (absents des maquettes, à valider sur capture) : historique Muscu, création de quête, formulaire boss, création de récompense, états vides ajoutés (historique, aperçu du profil, programme sans séance).
- Backlog technique : réordonner par glisser-déposer, calculs restants à passer en SQL, tests de composants et E2E.
