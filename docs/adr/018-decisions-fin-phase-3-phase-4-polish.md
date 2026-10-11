# ADR-018 : fin de la phase 3, phase 4 et polish (oct. 2026)
**Statut** : accepté

Décisions de Hugo ou de Claude validées pendant l'étape 6 de la phase 3, la phase 4 et le polish visuel. Elles complètent l'ADR-017.

## Tâches
- **Boss** : une tâche `is_boss` avec `boss_week` (lundi) et échéance au dimanche ; ses étapes sont des sous-tâches avec `hp` saisis par Hugo. Un seul boss par semaine, créé par un interrupteur dans le formulaire de tâche (ou « Invoquer un boss » sur Quêtes). +10 XP par étape (`boss_etape`), +150 XP à la victoire (`boss`), annulés si l'étape est décochée. La victoire est automatique quand la dernière étape est cochée. Un boss d'une semaine passée disparaît (il s'échappe), sans pénalité. Les boss sont exclus d'Aujourd'hui / À venir, des quêtes et de l'anti-triche.
- **Badges** : catalogue de 12 en code (`BADGES` dans `config.ts`), seuils sur une mesure (tâches terminées, meilleure série de jours actifs, quêtes validées, niveau, boss vaincus, habitudes validées). Un badge débloqué est enregistré dans `taches_badges` et reste acquis. Vérification après chaque gain d'XP et à l'ouverture de Progrès. 9 badges viennent de la maquette, 3 ont été ajoutés (Première habitude, Série de 10 jours, Niveau 20).
- **Récompenses perso** : une par niveau (de 2 à 99), titre libre, réclamable une fois le niveau atteint (calculé depuis le total d'XP), modifiable et supprimable.
- **Notifications** : rappels d'habitude uniquement (pas de rappel d'échéance de tâche). Voir ADR-014.

## Notifications push (précise l'ADR-014)
- `pg_cron` (chaque minute) → `pg_net` → Edge Function `send-reminders` → Web Push (VAPID). La fonction SQL `taches_due_reminders` (réservée à `service_role`) choisit les habitudes à rappeler.
- **La vérification JWT de l'Edge Function reste active** : le cron envoie la clé anon dans `Authorization` et un secret partagé dans `x-cron-secret`, tous deux lus dans le Vault (`anon_key`, `cron_secret`). Un appel de l'appli avec `{ test: true }` et le jeton de l'utilisateur envoie une notification d'essai.
- La clé publique VAPID est dans le code (`src/core/push/push.ts`). Secrets de la fonction : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (l'adresse du site, pas d'e-mail), `CRON_SECRET`.
- Les secrets ne sont jamais écrits dans le dépôt ; ils se posent par `supabase secrets set` et dans le Vault (SQL), à la main.

## Transverse
- **Accueil** : chaque module expose `useSummary()` dans son `index.ts` (type `ModuleSummary` : texte, `active`, `progress` 0-1). L'accueil n'importe rien d'autre. Tuile bleue = quelque chose attend aujourd'hui ; anneau = avancement (séances de la semaine / objectif, calories / objectif, niveau).
- **Export JSON** : 24 tables des 3 modules (ni `push_subscriptions` ni les vues), `{ app, version: 1, exported_at, tables }`. Un test échoue au typecheck si une nouvelle table n'est ni exportée ni exclue.
- **Import JSON par fusion** (jamais de suppression ni d'écrasement) : lignes reconnues par `id`, puis par clé naturelle (code-barres, niveau de récompense, clé de badge, date d'objectif, habitude + jour, réglages Muscu uniques) ; les liens vers une ligne reconnue sont rebranchés ; la séance encore ouverte du fichier est ignorée ; `user_id` est retiré. Aperçu et confirmation avant écriture. Les photos d'exercices ne sont pas dans le fichier.
- **Polish** : animations en CSS pur (changement d'écran, feuilles, barres qui se remplissent, cases qui « pop »), squelettes de chargement, vibrations (`core/haptics.ts`), surfaces en dégradé (`--surface`, `--shadow-card`). Respect de « réduire les animations ». Cases validées en **vert** (`--positive`) au lieu du bleu de la maquette (écart assumé, à confirmer par Hugo).
