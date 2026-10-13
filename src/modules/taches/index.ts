import type { AppModule } from '../../core/module'
import { COLORS } from './config'
import { tachesRoute } from './routes'
import { useSummary } from './summary'

export const tachesModule: AppModule = {
  path: '/taches',
  label: 'Tâches',
  icon: 'check',
  colors: COLORS,
  route: tachesRoute,
  useSummary,
}
