import type { AppModule } from '../../core/module'
import { tachesRoute } from './routes'
import { useSummary } from './summary'

export const tachesModule: AppModule = {
  path: '/taches',
  label: 'Tâches',
  icon: 'check',
  route: tachesRoute,
  useSummary,
}
