-- Schéma Tâches et gamification (ADR-007, docs/schema.md). RLS activée dans cette même migration (ADR-004/008).
-- Rien de dérivé n'est stocké : niveau, streaks, progression de quête se calculent ; seul l'XP est figé
-- dans le journal d'XP (append-only : lecture et insertion seulement, décocher = ligne négative).

create type public.task_priority as enum ('basse', 'normale', 'haute', 'critique');
create type public.task_difficulty as enum ('facile', 'moyen', 'difficile');
create type public.habit_moment as enum ('matin', 'aprem', 'soir', 'libre');
create type public.habit_type as enum ('fait', 'compteur');
create type public.quest_period as enum ('jour', 'semaine');
create type public.quest_kind as enum (
  'n_taches', 'n_taches_categorie', 'habitudes_moment', 'habitudes_jour', 'manuelle'
);
create type public.xp_source as enum ('tache', 'habitude', 'quete', 'boss_etape', 'boss');

create table public.taches_categories (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  color text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.taches_tasks (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  category_id uuid references public.taches_categories(id) on delete set null,
  priority public.task_priority not null default 'normale',
  difficulty public.task_difficulty not null default 'facile',
  due_date date,
  due_time time,
  -- ex. {"type":"daily"} ou {"type":"weekly"} ; à la validation, l'occurrence suivante est une nouvelle ligne
  recurrence jsonb,
  notes text,
  is_boss boolean not null default false,
  boss_week date,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.taches_subtasks (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid not null references public.taches_tasks(id) on delete cascade,
  title text not null,
  position int not null default 0,
  -- points de vie : seulement pour les étapes d'un boss
  hp int check (hp > 0),
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.taches_habits (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  category_id uuid references public.taches_categories(id) on delete set null,
  -- jours prévus, 1 = lundi … 7 = dimanche
  weekdays int[] not null default '{1,2,3,4,5,6,7}'
    check (weekdays <@ array[1,2,3,4,5,6,7] and cardinality(weekdays) > 0),
  moment public.habit_moment not null default 'libre',
  type public.habit_type not null default 'fait',
  target int check (target > 0),
  unit text,
  reminder_time time,
  difficulty public.task_difficulty not null default 'facile',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type = 'fait' or target is not null)
);

create table public.taches_habit_pauses (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references public.taches_habits(id) on delete cascade,
  start_day date not null,
  end_day date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_day is null or end_day >= start_day)
);

create table public.taches_habit_logs (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  habit_id uuid not null references public.taches_habits(id) on delete cascade,
  day date not null,
  value int not null default 1 check (value >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, day)
);

create table public.taches_xp_events (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source public.xp_source not null,
  source_id uuid,
  -- jour (heure de Paris) où l'XP a été gagné, pour les plafonds journaliers
  day date not null,
  xp int not null,
  -- facteur anti-triche appliqué (1 = aucun) ; figé avec l'événement
  factor numeric not null default 1 check (factor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.taches_quests (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  period public.quest_period not null,
  period_start date not null,
  kind public.quest_kind not null,
  params jsonb not null default '{}',
  target int not null check (target > 0),
  bonus_xp int not null default 0,
  recurring boolean not null default false,
  -- progression saisie à la main, pour les quêtes « manuelle » seulement
  manual_progress int not null default 0 check (manual_progress >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.taches_badges (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  badge_key text not null,
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create table public.taches_rewards (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  level int not null check (level >= 1),
  title text not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, level)
);

-- RLS : chaque ligne appartient à son utilisateur ; trigger updated_at sur chaque table.
do $$
declare t text;
begin
  foreach t in array array[
    'taches_categories', 'taches_tasks', 'taches_subtasks', 'taches_habits', 'taches_habit_pauses',
    'taches_habit_logs', 'taches_quests', 'taches_badges', 'taches_rewards'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "owner" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Journal d'XP append-only : on lit et on ajoute, jamais de modification ni de suppression côté appli.
alter table public.taches_xp_events enable row level security;
create policy "owner_select" on public.taches_xp_events for select using (user_id = auth.uid());
create policy "owner_insert" on public.taches_xp_events for insert with check (user_id = auth.uid());
create trigger set_updated_at before update on public.taches_xp_events
  for each row execute function public.set_updated_at();

create index taches_tasks_due_idx on public.taches_tasks (user_id, due_date) where completed_at is null;
create index taches_tasks_completed_idx on public.taches_tasks (user_id, completed_at);
create index taches_tasks_category_idx on public.taches_tasks (category_id);
create index taches_subtasks_task_idx on public.taches_subtasks (task_id);
create index taches_habits_category_idx on public.taches_habits (category_id);
create index taches_habit_pauses_habit_idx on public.taches_habit_pauses (habit_id);
create index taches_habit_logs_day_idx on public.taches_habit_logs (user_id, day);
create index taches_xp_events_day_idx on public.taches_xp_events (user_id, day);
create index taches_xp_events_source_idx on public.taches_xp_events (source, source_id);
create index taches_quests_period_idx on public.taches_quests (user_id, period, period_start);
