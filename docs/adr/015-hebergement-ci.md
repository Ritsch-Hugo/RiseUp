# ADR-015 : hébergement, CI, tests
**Statut** : accepté (limites vérifiées en oct. 2026)

- **Cloudflare Pages** : 500 builds/mois, bande passante illimitée, `_headers` (CSP future), previews illimitées, HTTPS sur `*.pages.dev`. Écartés : GitHub Pages (pas d'en-têtes), Vercel (rien de plus).
- **GitHub Actions** : `npm ci` → lint → typecheck → tests → build ; sur `main` : `supabase db push` puis déploiement. Cron anti-pause Supabase.
- **Tests** : Vitest sur les règles métier en priorité. Composants / E2E Playwright au backlog.
- **Repo public** (vitrine) : rien de secret dedans.
