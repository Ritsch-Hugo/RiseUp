# ADR-006 : schéma Nutrition
**Statut** : accepté — détail dans `docs/schema.md`

- Aliment Open Food Facts enregistré dans `nutri_foods` au choix → sert de cache.
- Valeurs nutritionnelles **copiées** dans chaque entrée du journal (historique stable).
- Ajouter un repas enregistré = une entrée par aliment. « Copier hier » idem.
- Objectifs datés (`effective_from`) : les jours passés sont comparés aux objectifs de l'époque.
- Eau en ajouts successifs (annulation du dernier verre possible).
- Récents calculés depuis le journal.
