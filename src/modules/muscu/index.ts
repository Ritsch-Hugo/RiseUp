import type { AppModule } from '../../core/module'
import { muscuRoute } from './routes'

export const muscuModule: AppModule = {
  path: '/muscu',
  label: 'Muscu',
  icon: 'dumbbell',
  route: muscuRoute,
}
