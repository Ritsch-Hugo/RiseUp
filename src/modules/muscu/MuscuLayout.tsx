import { useLocation } from 'react-router-dom'
import { ModuleLayout, type Tab } from '../../core/ui'
import { useOpenWorkout } from './workout/workoutQueries'
import { WorkoutBar } from './workout/WorkoutBar'

const tabs: Tab[] = [
  { to: '/muscu', label: 'Accueil', icon: 'home', end: true },
  { to: '/muscu/bibliotheque', label: 'Bibliothèque', icon: 'library' },
  { to: '/muscu/profil', label: 'Profil', icon: 'user' },
]

export function MuscuLayout() {
  const { data: workout } = useOpenWorkout()
  const { pathname } = useLocation()
  const banner =
    workout && pathname !== '/muscu/seance' ? <WorkoutBar workout={workout} /> : undefined
  return <ModuleLayout title="Muscu" tabs={tabs} banner={banner} />
}
