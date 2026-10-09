import type { RouteObject } from 'react-router-dom'
import { ComingSoon, ModuleLayout, type Tab } from '../../core/ui'

const tabs: Tab[] = [
  { to: '/muscu', label: 'Accueil', icon: 'home', end: true },
  { to: '/muscu/bibliotheque', label: 'Bibliothèque', icon: 'library' },
  { to: '/muscu/profil', label: 'Profil', icon: 'user' },
]

export const muscuRoute: RouteObject = {
  path: 'muscu',
  element: <ModuleLayout title="Muscu" tabs={tabs} />,
  children: [
    { index: true, element: <ComingSoon name="Accueil Muscu" /> },
    { path: 'bibliotheque', element: <ComingSoon name="Bibliothèque" /> },
    { path: 'profil', element: <ComingSoon name="Profil" /> },
  ],
}
