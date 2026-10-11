# ADR-017 : décisions prises en cours de développement (oct. 2026)
**Statut** : accepté

Décisions de Hugo ou de Claude validées pendant les phases 1 à 3, qui précisent ou complètent les ADR 005-012.

## Muscu
- `muscu_exercises.equipment` et `tracking` (poids × reps / reps / durée) et `muscu_sets.duration_seconds` ajoutés ; 249 exercices FR préchargés (free-exercise-db).
- Dérivés en vues SQL : `muscu_workout_stats`, `muscu_workout_records` (parité vérifiée avec la règle TypeScript sur données aléatoires). Les autres calculs restent côté client pour l'instant.
- Profil : récupération par muscle (12 h + 4 h × séries, max 48 h), muscles sollicités (séries semaine / 15), équilibre haut/bas (abdos avec le bas) et push/pull.
- Prochaine séance : celle qui suit la dernière séance type effectuée, dans l'ordre du programme, en boucle.

## Nutrition
- Pas d'aliments préchargés (Open Food Facts + aliments perso), objectifs par défaut 2 400 kcal / 160 / 260 / 70 g.
- « Dans l'objectif » (stats) : calories à ± 5 % de l'objectif du jour ; aujourd'hui exclu des moyennes.
- Recherche texte Open Food Facts via Edge Function (ADR-016).

## Tâches
- Priorités : basse, normale, haute, critique (maquette).
- Série du badge = jours actifs. Récurrence : jour ou semaine, l'occurrence suivante est créée à la validation (`recurred_from`).
- Quêtes : 5 types + filtre de difficulté, bonus fixes +20 / +75.
- Journal d'XP append-only ; anti-triche appliqué à l'écriture et stocké dans `factor`.

## Technique
- Les fichiers testés par Vitest (`rules/*.ts`) n'importent jamais l'index de `core` (charge Supabase, absent en CI) : importer `core/dates`, `core/streak`.
- Migrations appliquées par la CI au push sur main, puis régénération des types (`supabase gen types`).
