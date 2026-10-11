# ADR-014 : notifications
**Statut** : accepté et implémenté (phase 3). Précisions et écarts : voir ADR-018.

- Pas de notification programmée côté navigateur (API abandonnée) → push serveur.
- pg_cron (toutes les minutes) → pg_net → Edge Function → Web Push (VAPID). ~43 000 invocations/mois (quota gratuit : 500 000).
- Rappel envoyé seulement si l'habitude est prévue aujourd'hui, pas en pause, pas faite.
- Table `push_subscriptions` (un abonnement par appareil). Cible : Chrome Android, PWA installée.
