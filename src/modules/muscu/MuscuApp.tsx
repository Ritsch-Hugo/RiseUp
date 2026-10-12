import { useRoutes, type RouteObject } from 'react-router-dom'
import { BibliothequePage } from './library/BibliothequePage'
import { ExerciceFormPage } from './library/ExerciceFormPage'
import { ExercicePage } from './library/ExercicePage'
import { GroupePage } from './library/GroupePage'
import { ExercisesPage } from './profile/ExercisesPage'
import { OverviewPage } from './profile/OverviewPage'
import { StatsPage } from './profile/StatsPage'
import { ProfilePage } from './profile/ProfilePage'
import { MuscuLayout } from './MuscuLayout'
import { LancerSeancePage } from './programs/LancerSeancePage'
import { ProgrammeFormPage } from './programs/ProgrammeFormPage'
import { ProgrammePage } from './programs/ProgrammePage'
import { ProgrammesPage } from './programs/ProgrammesPage'
import { SeancePage } from './programs/SeancePage'
import { ActiveWorkoutPage } from './workout/ActiveWorkoutPage'
import { HistoryPage } from './workout/HistoryPage'
import { MuscuHomePage } from './workout/MuscuHomePage'
import { SummaryPage } from './workout/SummaryPage'

const routes: RouteObject[] = [
  {
    element: <MuscuLayout />,
    children: [
      { index: true, element: <MuscuHomePage /> },
      { path: 'seance', element: <ActiveWorkoutPage /> },
      { path: 'historique', element: <HistoryPage /> },
      { path: 'resume/:id', element: <SummaryPage /> },
      { path: 'bibliotheque', element: <BibliothequePage /> },
      { path: 'bibliotheque/programmes', element: <ProgrammesPage /> },
      { path: 'bibliotheque/programmes/:id', element: <ProgrammePage /> },
      { path: 'bibliotheque/programmes/:id/modifier', element: <ProgrammeFormPage /> },
      { path: 'bibliotheque/programmes/:id/seance/:sessionId', element: <LancerSeancePage /> },
      { path: 'bibliotheque/programmes/:id/seance/:sessionId/modifier', element: <SeancePage /> },
      { path: 'bibliotheque/nouveau', element: <ExerciceFormPage /> },
      { path: 'bibliotheque/:group', element: <GroupePage /> },
      { path: 'bibliotheque/exercice/:id', element: <ExercicePage /> },
      { path: 'bibliotheque/exercice/:id/modifier', element: <ExerciceFormPage /> },
      {
        path: 'profil',
        element: <ProfilePage />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'exercices', element: <ExercisesPage /> },
          { path: 'stats', element: <StatsPage /> },
        ],
      },
    ],
  },
]

/** Écrans du module, chargés à la demande (routes relatives à /muscu). */
export default function MuscuApp() {
  return useRoutes(routes)
}
