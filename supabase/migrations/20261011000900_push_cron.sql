-- Toutes les minutes, pg_cron appelle l'Edge Function send-reminders via pg_net (ADR-014).
-- La vérification JWT de la fonction reste active : l'appel porte la clé anon (Authorization) et un secret
-- partagé (x-cron-secret) que la fonction contrôle. Les deux sont lus dans le Vault (secrets « anon_key » et
-- « cron_secret »), jamais écrits dans le dépôt.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'taches-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://ignhaeulwlnusggpzkyu.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key' limit 1),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    body := '{}'::jsonb
  );
  $$
);
