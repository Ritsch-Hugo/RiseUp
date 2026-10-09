import type { AppModule } from '../../core/module'
import { tachesRoute } from './routes'

export const tachesModule: AppModule = {
  path: '/taches',
  label: 'Tâches',
  icon: 'check',
  route: tachesRoute,
}
