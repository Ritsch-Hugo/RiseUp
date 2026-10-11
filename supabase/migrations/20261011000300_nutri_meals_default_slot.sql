-- Repas enregistré : créneau habituel (optionnel), proposé à l'ajout au journal.
alter table public.nutri_meals add column default_slot public.meal_slot;
