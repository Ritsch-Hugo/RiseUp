import type { RouteObject } from 'react-router-dom'
import { ComingSoon, ModuleLayout, type Tab } from '../../core/ui'
import { ExerciceFormPage } from './library/ExerciceFormPage'
import { ExercicePage } from './library/ExercicePage'
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
    { path: 'bibliotheque/nouveau', element: <ExerciceFormPage /> },
    { path: 'bibliotheque/:group', element: <GroupePage /> },
    { path: 'bibliotheque/exercice/:id', element: <ExercicePage /> },
    { path: 'bibliotheque/exercice/:id/modifier', element: <ExerciceFormPage /> },
    { path: 'profil', element: <ComingSoon name="Profil" /> },
  ],
}
