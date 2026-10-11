-- Schéma Nutrition (ADR-006, docs/schema.md). RLS activée dans cette même migration (ADR-004/008).
-- Valeurs nutritionnelles de nutri_foods : pour 100 g. Celles de nutri_entries : copiées pour la quantité
-- (historique stable). Rien d'autre n'est stocké : totaux, moyennes et streak seront des vues.

create type public.meal_slot as enum ('petit_dej', 'dejeuner', 'diner', 'collation');
create type public.food_source as enum ('off', 'perso');

create table public.nutri_foods (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  brand text,
  barcode text,
  source public.food_source not null default 'perso',
  -- kcal absentes (aliment perso) : calculées P × 4 + G × 4 + L × 9 par l'appli
  kcal numeric check (kcal >= 0),
  protein numeric not null default 0 check (protein >= 0),
  carbs numeric not null default 0 check (carbs >= 0),
  sugars numeric not null default 0 check (sugars >= 0),
  fat numeric not null default 0 check (fat >= 0),
  saturated_fat numeric not null default 0 check (saturated_fat >= 0),
  fiber numeric not null default 0 check (fiber >= 0),
  salt numeric not null default 0 check (salt >= 0),
  serving_g numeric check (serving_g > 0),
  serving_label text,
  is_favorite boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nutri_foods enable row level security;
create policy "owner" on public.nutri_foods
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.nutri_foods
  for each row execute function public.set_updated_at();

create table public.nutri_meals (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nutri_meals enable row level security;
create policy "owner" on public.nutri_meals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.nutri_meals
  for each row execute function public.set_updated_at();

create table public.nutri_meal_items (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  meal_id uuid not null references public.nutri_meals(id) on delete cascade,
  food_id uuid not null references public.nutri_foods(id),
  quantity_g numeric not null check (quantity_g > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nutri_meal_items enable row level security;
create policy "owner" on public.nutri_meal_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.nutri_meal_items
  for each row execute function public.set_updated_at();

create table public.nutri_entries (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  slot public.meal_slot not null,
  food_id uuid not null references public.nutri_foods(id),
  quantity_g numeric not null check (quantity_g > 0),
  kcal numeric not null check (kcal >= 0),
  protein numeric not null default 0 check (protein >= 0),
  carbs numeric not null default 0 check (carbs >= 0),
  sugars numeric not null default 0 check (sugars >= 0),
  fat numeric not null default 0 check (fat >= 0),
  saturated_fat numeric not null default 0 check (saturated_fat >= 0),
  fiber numeric not null default 0 check (fiber >= 0),
  salt numeric not null default 0 check (salt >= 0),
  from_meal_id uuid references public.nutri_meals(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nutri_entries enable row level security;
create policy "owner" on public.nutri_entries
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.nutri_entries
  for each row execute function public.set_updated_at();

create table public.nutri_water (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  amount_ml int not null check (amount_ml > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.nutri_water enable row level security;
create policy "owner" on public.nutri_water
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.nutri_water
  for each row execute function public.set_updated_at();

-- Objectifs datés : l'objectif d'un jour = la ligne au plus grand effective_from <= jour.
create table public.nutri_goals (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  effective_from date not null,
  kcal int not null default 2400 check (kcal > 0),
  protein_g int not null default 160 check (protein_g >= 0),
  carbs_g int not null default 260 check (carbs_g >= 0),
  fat_g int not null default 70 check (fat_g >= 0),
  fiber_g int not null default 30 check (fiber_g >= 0),
  salt_g numeric not null default 5 check (salt_g >= 0),
  water_ml int not null default 2500 check (water_ml >= 0),
  min_slots_tracked int not null default 2 check (min_slots_tracked between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, effective_from)
);
alter table public.nutri_goals enable row level security;
create policy "owner" on public.nutri_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.nutri_goals
  for each row execute function public.set_updated_at();

create unique index nutri_foods_barcode_idx on public.nutri_foods (user_id, barcode) where barcode is not null;
create index nutri_meal_items_meal_id_idx on public.nutri_meal_items (meal_id);
create index nutri_meal_items_food_id_idx on public.nutri_meal_items (food_id);
create index nutri_entries_day_idx on public.nutri_entries (user_id, day);
create index nutri_entries_food_id_idx on public.nutri_entries (food_id);
create index nutri_water_day_idx on public.nutri_water (user_id, day);
