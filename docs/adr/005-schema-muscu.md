# ADR-005 : schéma Muscu
**Statut** : accepté — détail dans `docs/schema.md`

- Séance en cours = `muscu_workouts.ended_at` null ; chaque série validée part en base (reprise possible sur PC).
- Séances réalisées copiées depuis le programme, pas liées : modifier un programme ne touche pas l'historique.
- 10 groupes musculaires (enum) : Pecs, Dos, Épaules, Biceps, Triceps, Quadriceps, Ischios, Fessiers, Mollets, Abdos.
- Bibliothèque de base copiée dans le compte (`is_custom = false`).
- Groupe principal 100 %, groupes secondaires 50 %.
- RPE seul (RIR ≈ 10 − RPE), optionnel. Séries d'échauffement exclues des records et du volume.
- Source des exercices : free-exercise-db (Unlicense / domaine public), ~100 exercices sélectionnés et traduits en FR dans `supabase/seed/`. Images de base servies en statique ; photos perso dans Supabase Storage. Silhouette et pictos : SVG maison.
- Mapping des muscles free-exercise-db : lats, middle back, lower back, traps, neck → Dos ; forearms → Biceps ; adductors → Quadriceps ; abductors, glutes → Fessiers ; calves → Mollets.
