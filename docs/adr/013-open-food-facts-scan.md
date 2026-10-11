# ADR-013 : Open Food Facts et scan
**Statut** : accepté (vérifié en oct. 2026) — la recherche texte passe par un proxy, voir ADR-016

- Licence ODbL (citation + partage à l'identique si on publie une base dérivée) → mention « Données : Open Food Facts » sur la fiche aliment.
- Identification obligatoire : le navigateur ne permet pas de définir le User-Agent → paramètres `app_name` / `app_version`.
- Limites par endpoint et par utilisateur : appels directs depuis le navigateur, champs limités au nécessaire, recherche locale d'abord, OFF seulement à la validation, aliment mis en cache dans `nutri_foods`.
- Fiche pré-remplie, corrigeable avant enregistrement (données collaboratives).
- Scan : lib `barcode-detector` (API native si dispo, sinon zxing-wasm). Formats EAN-13, EAN-8, UPC-A, UPC-E. Saisie manuelle en secours. HTTPS requis.
