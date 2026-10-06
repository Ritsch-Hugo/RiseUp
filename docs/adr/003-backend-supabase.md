# ADR-003 : backend Supabase
**Statut** : accepté (limites vérifiées en oct. 2026)

**Décision** : Supabase (Postgres, Auth, Storage, Edge Functions, pg_cron).
**Plan gratuit** : 500 Mo de base, 1 Go de stockage, 5 Go de bande passante, 2 projets, 500 000 invocations d'Edge Functions/mois.
**Risque** : pause du projet après 7 jours de faible activité (données conservées, restauration possible). Parade : cron GitHub Actions qui interroge la base régulièrement.
**Écartés** : Firebase (Storage exige le plan Blaze depuis févr. 2026, NoSQL peu adapté aux stats), Cloudflare D1 (pas d'auth intégrée, quotas quotidiens bloquants).
