-- Notifications push (ADR-014) : un abonnement par appareil + sélection des rappels d'habitude à envoyer.

create table public.push_subscriptions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  device_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
create policy "owner" on public.push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger set_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

-- Habitudes à rappeler à la minute `p_at` (heure de Paris) : rappel réglé à cette heure, habitude active,
-- prévue ce jour-là, pas en pause et pas encore faite (case cochée, ou compteur à l'objectif).
create function public.taches_due_reminders(p_at timestamptz default now())
returns table (user_id uuid, habit_id uuid, name text)
language sql
stable
security definer
set search_path = public
as $$
  with n as (select (p_at at time zone 'Europe/Paris') as t)
  select h.user_id, h.id, h.name
  from public.taches_habits h, n
  where h.archived_at is null
    and h.reminder_time is not null
    and h.reminder_time = date_trunc('minute', n.t)::time
    and extract(isodow from n.t)::int = any (h.weekdays)
    and not exists (
      select 1 from public.taches_habit_pauses p
      where p.habit_id = h.id
        and p.start_day <= n.t::date
        and (p.end_day is null or p.end_day >= n.t::date)
    )
    and not exists (
      select 1 from public.taches_habit_logs l
      where l.habit_id = h.id
        and l.day = n.t::date
        and ((h.type = 'fait' and l.value >= 1)
          or (h.type = 'compteur' and l.value >= coalesce(h.target, 2147483647)))
    );
$$;

-- Réservée à l'Edge Function (clé service_role), jamais au front.
revoke execute on function public.taches_due_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.taches_due_reminders(timestamptz) to service_role;
