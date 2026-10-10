import type { RouteObject } from 'react-router-dom'
import { ComingSoon, ModuleLayout, type Tab } from '../../core/ui'
import { BibliothequePage } from './library/BibliothequePage'
import { GroupePage } from './library/GroupePage'

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
    { path: 'bibliotheque', element: <BibliothequePage /> },
    { path: 'bibliotheque/:group', element: <GroupePage /> },
    { path: 'bibliotheque/exercice/:id', element: <ComingSoon name="Fiche exercice" /> },
    { path: 'profil', element: <ComingSoon name="Profil" /> },
  ],
}
