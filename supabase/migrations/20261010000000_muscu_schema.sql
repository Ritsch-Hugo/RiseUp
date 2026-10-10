-- Schéma Muscu (ADR-005, docs/schema.md). RLS activée dans cette même migration (ADR-004/008).
-- Séance en cours = muscu_workouts.ended_at null. Aucune donnée dérivée stockée.

create type public.muscle_group as enum (
  'pecs', 'dos', 'epaules', 'biceps', 'triceps',
  'quadriceps', 'ischios', 'fessiers', 'mollets', 'abdos'
);

create table public.muscu_exercises (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  primary_group public.muscle_group not null,
  secondary_groups public.muscle_group[] not null default '{}',
  image_path text,
  instructions text,
  is_custom boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.muscu_exercises enable row level security;
create policy "owner" on public.muscu_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.muscu_exercises
  for each row execute function public.set_updated_at();

create table public.muscu_programs (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  days_per_week int check (days_per_week between 1 and 7),
  position int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.muscu_programs enable row level security;
create policy "owner" on public.muscu_programs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.muscu_programs
  for each row execute function public.set_updated_at();

create table public.muscu_program_sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  program_id uuid not null references public.muscu_programs(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.muscu_program_sessions enable row level security;
create policy "owner" on public.muscu_program_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.muscu_program_sessions
  for each row execute function public.set_updated_at();

create table public.muscu_session_exercises (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null references public.muscu_program_sessions(id) on delete cascade,
  exercise_id uuid not null references public.muscu_exercises(id),
  position int not null default 0,
  target_sets int check (target_sets > 0),
  target_reps_min int check (target_reps_min > 0),
  target_reps_max int check (target_reps_max >= target_reps_min),
  rest_seconds int check (rest_seconds >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.muscu_session_exercises enable row level security;
create policy "owner" on public.muscu_session_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.muscu_session_exercises
  for each row execute function public.set_updated_at();

create table public.muscu_workouts (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid references public.muscu_program_sessions(id) on delete set null,
  name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz check (ended_at is null or ended_at >= started_at),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.muscu_workouts enable row level security;
create policy "owner" on public.muscu_workouts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.muscu_workouts
  for each row execute function public.set_updated_at();

create table public.muscu_workout_exercises (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_id uuid not null references public.muscu_workouts(id) on delete cascade,
  exercise_id uuid not null references public.muscu_exercises(id),
  position int not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.muscu_workout_exercises enable row level security;
create policy "owner" on public.muscu_workout_exercises
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.muscu_workout_exercises
  for each row execute function public.set_updated_at();

create table public.muscu_sets (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  workout_exercise_id uuid not null references public.muscu_workout_exercises(id) on delete cascade,
  position int not null default 0,
  weight_kg numeric not null default 0 check (weight_kg >= 0),
  reps int not null check (reps >= 0),
  rpe numeric check (rpe between 1 and 10),
  is_warmup boolean not null default false,
  done_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.muscu_sets enable row level security;
create policy "owner" on public.muscu_sets
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.muscu_sets
  for each row execute function public.set_updated_at();

create table public.muscu_settings (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weekly_goal int not null default 3 check (weekly_goal between 1 and 7),
  muscle_sets_threshold int not null default 15 check (muscle_sets_threshold > 0),
  unique (user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.muscu_settings enable row level security;
create policy "owner" on public.muscu_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.muscu_settings
  for each row execute function public.set_updated_at();

-- Index sur les clés étrangères et les filtres courants

create index muscu_exercises_primary_group_idx on public.muscu_exercises (primary_group);
create index muscu_program_sessions_program_id_idx on public.muscu_program_sessions (program_id);
create index muscu_session_exercises_session_id_idx on public.muscu_session_exercises (session_id);
create index muscu_session_exercises_exercise_id_idx on public.muscu_session_exercises (exercise_id);
create index muscu_workouts_started_at_idx on public.muscu_workouts (started_at);
create index muscu_workout_exercises_workout_id_idx on public.muscu_workout_exercises (workout_id);
create index muscu_workout_exercises_exercise_id_idx on public.muscu_workout_exercises (exercise_id);
create index muscu_sets_workout_exercise_id_idx on public.muscu_sets (workout_exercise_id);
create unique index muscu_workouts_one_open_idx on public.muscu_workouts (user_id) where ended_at is null;
