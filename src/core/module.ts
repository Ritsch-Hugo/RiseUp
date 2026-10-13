import type { RouteObject } from 'react-router-dom'
import type { IconName } from './ui'

/** accent : décor et texte vif ; solid : fond des boutons pleins (texte blanc) ; text : liens et texte coloré. */
export type ModuleColors = { accent: string; solid: string; text: string }

/** Résumé d'un module sur l'accueil : une ligne, et `active` quand quelque chose attend aujourd'hui. */
export type ModuleSummary = {
  text: string
  active: boolean
  /** Avancement du jour ou de la semaine, de 0 à 1 (anneau autour de l'icône). */
  progress?: number
  /** Chiffre clé affiché en grand sur la carte d'accueil. */
  stat?: { value: string; unit: string }
}

/** Ce que chaque module expose à l'app (via son index.ts) : carte d'accueil + routes. */
export type AppModule = {
  path: string
  label: string
  icon: IconName
  /** Couleurs propres au module (accueil et écrans du module). */
  colors: ModuleColors
  route: RouteObject
  /** Hook du résumé d'accueil ; null tant que les données se chargent. */
  useSummary: () => ModuleSummary | null
}
