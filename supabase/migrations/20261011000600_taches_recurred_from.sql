-- Tâche récurrente : l'occurrence suivante garde un lien vers celle qui l'a générée,
-- pour pouvoir la retirer si l'on décoche la précédente (ADR-007 §1).
alter table public.taches_tasks
  add column recurred_from uuid references public.taches_tasks(id) on delete set null;
create index taches_tasks_recurred_from_idx on public.taches_tasks (recurred_from);
