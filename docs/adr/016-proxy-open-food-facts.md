# ADR-016 : recherche Open Food Facts via une Edge Function
**Statut** : accepté (11 oct. 2026) — remplace l'ADR-013 sur la recherche texte (le reste de l'ADR-013 reste valable)

**Constat** : le moteur de recherche récent d'OFF (`search.openfoodfacts.org`) ne renvoie pas d'en-tête CORS pour notre origine, donc le navigateur ne peut pas lire ses réponses. L'ancienne recherche (`cgi/search.pl`) répond avec CORS mais échoue en 503 environ une fois sur deux, et `world.openfoodfacts.org` la refuse. Le produit par code-barres (`/api/v2/product/<code>.json`) répond bien, avec CORS `*`.

**Décision** :
- **Recherche texte** : Edge Function Supabase `off-search` (Deno), appelée par l'app avec la session de Hugo ; elle interroge `search.openfoodfacts.org` avec un `User-Agent` d'identification (sans e-mail, le repo est public). Elle refuse les appels sans utilisateur connecté (la clé anon publique ne suffit pas), limite la taille de la requête et renvoie les 20 premiers résultats.
- **Scan** : l'app appelle directement `/api/v2/product/<code>.json` (champs limités, `app_name` / `app_version`).
- Le reste de l'ADR-013 s'applique : recherche locale d'abord, OFF seulement sur action explicite, fiche pré-remplie et corrigeable, aliment mis en cache dans `nutri_foods`, mention « Données : Open Food Facts ».
- **Déploiement** : étape `supabase functions deploy off-search --use-api` dans le job `migrate` de la CI.
