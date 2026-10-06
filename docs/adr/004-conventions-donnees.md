# ADR-004 : conventions de données et synchro
**Statut** : accepté

- Tables préfixées par module dans `public`.
- `id` UUID généré côté client ; `user_id default auth.uid()` + RLS `user_id = auth.uid()` partout ; `created_at`, `updated_at` (trigger).
- Suppression réelle par défaut ; `archived_at` pour ce qui est référencé par l'historique.
- kg, secondes, nutriments pour 100 g ; `timestamptz` pour les événements, `day date` (Europe/Paris) pour les jours.
- Rien de dérivé stocké : vues / fonctions SQL. Exceptions : nutriments copiés dans le journal (ADR-006), XP figé (ADR-007).
- Synchro : pas de moteur. TanStack Query recharge au retour sur l'app / au retour du réseau. Conflit : dernière écriture gagne.
