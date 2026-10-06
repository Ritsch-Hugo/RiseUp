# ADR-008 : sécurité (minimum vital)
**Statut** : accepté — le reste est reporté

**Appliqué dès maintenant** :
- RLS sur toutes les tables (l'URL et la clé publique sont visibles dans le front).
- Inscriptions désactivées dans Supabase.
- Clé `service_role` jamais dans le front.

**Backlog Sécurité** : 2FA TOTP imposée en RLS (`aal2`), CSP + en-têtes (HSTS, frame-ancestors, Referrer-Policy, Permissions-Policy), bucket privé + URL signées, validation zod + CHECK, Dependabot / scan de vulnérabilités / gitleaks / Actions épinglées par SHA, dump hebdo chiffré (age), modèle de menaces STRIDE, test CI « toutes les tables ont la RLS ».
**Risque accepté** : pas de chiffrement de bout en bout (incompatible avec les stats SQL).
