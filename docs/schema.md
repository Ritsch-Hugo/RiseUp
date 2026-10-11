# Schéma de données

Colonnes communes à toutes les tables (ADR-004) : `id uuid pk`, `user_id uuid default auth.uid()`, `created_at timestamptz`, `updated_at timestamptz` (trigger). RLS `user_id = auth.uid()` sur chaque table.

## Muscu

Enum `muscle_group` : `pecs, dos, epaules, biceps, triceps, quadriceps, ischios, fessiers, mollets, abdos`.

| Table | Colonnes |
|---|---|
| `muscu_exercises` | name, primary_group muscle_group, secondary_groups muscle_group[], image_path, instructions, is_custom bool, archived_at |
| `muscu_programs` | name, days_per_week, position, archived_at |
| `muscu_program_sessions` | program_id, name, position |
| `muscu_session_exercises` | session_id, exercise_id, position, target_sets, target_reps_min, target_reps_max, rest_seconds, notes |
| `muscu_workouts` | session_id (nullable), name, started_at, ended_at (null = en cours), notes |
| `muscu_workout_exercises` | workout_id, exercise_id, position, notes |
| `muscu_sets` | workout_exercise_id, position, weight_kg numeric, reps int, rpe numeric null, is_warmup bool, done_at |
| `muscu_settings` | weekly_goal int (défaut 3), muscle_sets_threshold (défaut 15) |

Vues : records par exercice, 1RM estimé, volume par séance / semaine / muscle, séries effectives par muscle, récupération, streak.

## Nutrition

Enum `meal_slot` : `petit_dej, dejeuner, diner, collation`.

| Table | Colonnes |
|---|---|
| `nutri_foods` | name, brand, barcode, source (off \| perso), kcal, protein, carbs, sugars, fat, saturated_fat, fiber, salt (pour 100 g), serving_g, serving_label, is_favorite, archived_at |
| `nutri_meals` | name, default_slot meal_slot null (repas habituel) |
| `nutri_meal_items` | meal_id, food_id, quantity_g |
| `nutri_entries` | day date, slot meal_slot, food_id, quantity_g, kcal, protein, carbs, sugars, fat, saturated_fat, fiber, salt (valeurs copiées pour la quantité), from_meal_id null |
| `nutri_water` | day date, amount_ml |
| `nutri_goals` | effective_from date, kcal, protein_g, carbs_g, fat_g, fiber_g, salt_g, water_ml, min_slots_tracked (1-3, défaut 2) |

## Tâches

Enums : `task_priority` (basse, normale, haute, critique), `difficulty` (facile, moyen, difficile), `habit_moment` (matin, aprem, soir, libre), `habit_type` (fait, compteur), `quest_period` (jour, semaine), `xp_source` (tache, habitude, quete, boss_etape, boss).

| Table | Colonnes |
|---|---|
| `taches_categories` | name, color, position |
| `taches_tasks` | title, category_id, priority, difficulty, due_date, due_time null, recurrence jsonb null (`{"type":"daily"}` ou `weekly`), recurred_from (occurrence précédente), notes, is_boss, boss_week date null, completed_at, archived_at |
| `taches_subtasks` | task_id, title, position, hp int null (boss), done_at |
| `taches_habits` | name, category_id null, weekdays int[], moment, type, target int null, unit, reminder_time null, difficulty, archived_at |
| `taches_habit_pauses` | habit_id, start_day, end_day null |
| `taches_habit_logs` | habit_id, day date, value int — unique (habit_id, day) |
| `taches_xp_events` | source xp_source, source_id, day date, xp int (peut être négatif), factor numeric — append-only (RLS : lecture et insertion seulement) |
| `taches_quests` | title, period, period_start date, kind (type de critère), params jsonb (difficulty, category_id, moment), target int, bonus_xp, recurring bool, manual_progress (quêtes manuelles), completed_at |
| `taches_badges` | badge_key, unlocked_at |
| `taches_rewards` | level int, title, claimed_at |
| `push_subscriptions` | endpoint, p256dh, auth, device_label |

Types de quête (`kind`) : `n_taches`, `n_taches_categorie`, `habitudes_moment`, `habitudes_jour`, `manuelle`.

## Vues SQL (dérivés, `security_invoker`)
- Muscu : `muscu_workout_stats` (durée, volume, séries, groupes par séance comptée), `muscu_workout_records` (records battus par séance).
- Nutrition : `nutri_day_totals` (totaux et créneaux suivis par jour), `nutri_water_day`.
- Tâches : `taches_xp_total`, `taches_active_days` (série du badge), `taches_completed_by_day`.
- Edge Function : `off-search` (proxy de recherche Open Food Facts, ADR-016).

