import { useRoutes, type RouteObject } from 'react-router-dom'
import { HabitFormPage } from './habits/HabitFormPage'
import { HabitsPage } from './habits/HabitsPage'
import { QuestFormPage } from './quests/QuestFormPage'
import { QuestsPage } from './quests/QuestsPage'
import { TachesLayout } from './TachesLayout'
import { ProgressPage } from './xp/ProgressPage'
import { RewardPage } from './xp/RewardPage'
import { TaskDetailPage } from './tasks/TaskDetailPage'
import { UpcomingPage } from './tasks/UpcomingPage'
import { TaskFormPage } from './tasks/TaskFormPage'
import { TodayPage } from './tasks/TodayPage'

const routes: RouteObject[] = [
  {
    element: <TachesLayout />,
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'recompense', element: <RewardPage /> },
      { path: 'nouvelle', element: <TaskFormPage /> },
      { path: 'habitudes', element: <HabitsPage /> },
      { path: 'habitudes/nouvelle', element: <HabitFormPage /> },
      { path: 'habitudes/:id', element: <HabitFormPage /> },
      { path: ':id', element: <TaskDetailPage /> },
      { path: ':id/modifier', element: <TaskFormPage /> },
      { path: 'a-venir', element: <UpcomingPage /> },
      { path: 'quetes', element: <QuestsPage /> },
      { path: 'quetes/nouvelle', element: <QuestFormPage /> },
      { path: 'progres', element: <ProgressPage /> },
    ],
  },
]

/** Écrans du module, chargés à la demande (routes relatives à /taches). */
export default function TachesApp() {
  return useRoutes(routes)
}
