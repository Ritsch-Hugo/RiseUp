import type { RouteObject } from 'react-router-dom'
import type { IconName } from './ui'

/** Résumé d'un module sur l'accueil : une ligne, et `active` quand quelque chose attend aujourd'hui. */
export type ModuleSummary = { text: string; active: boolean }

/** Ce que chaque module expose à l'app (via son index.ts) : carte d'accueil + routes. */
export type AppModule = {
  path: string
  label: string
  icon: IconName
  route: RouteObject
  /** Hook du résumé d'accueil ; null tant que les données se chargent. */
  useSummary: () => ModuleSummary | null
}
