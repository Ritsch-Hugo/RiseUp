import type { RouteObject } from 'react-router-dom'
import type { IconName } from './ui'

/** Ce que chaque module expose à l'app (via son index.ts) : carte d'accueil + routes. */
export type AppModule = {
  path: string
  label: string
  icon: IconName
  route: RouteObject
}
