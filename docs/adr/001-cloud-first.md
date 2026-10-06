# ADR-001 : cloud-first
**Statut** : accepté

**Contexte** : le hors-ligne n'est pas un besoin.
**Décision** : le serveur (Supabase) est la référence, une connexion est requise.
**Garde-fous** : mises à jour optimistes (l'UI réagit sans attendre le réseau) ; brouillon de la séance en cours gardé en local.
**Conséquence** : backend central → choisi avec une base standard (Postgres) pour rester migrable.
