-- Migration initiale : fonction commune pour updated_at (ADR-004).
-- Les tables métier viennent avec leurs modules (muscu_, nutri_, taches_).

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Modèle à recopier dans chaque migration de création de table :
--
--   create table public.xxx_exemple (
--     id uuid primary key,
--     user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
--     created_at timestamptz not null default now(),
--     updated_at timestamptz not null default now()
--   );
--   alter table public.xxx_exemple enable row level security;
--   create policy "owner" on public.xxx_exemple
--     for all using (user_id = auth.uid()) with check (user_id = auth.uid());
--   create trigger set_updated_at before update on public.xxx_exemple
--     for each row execute function public.set_updated_at();
