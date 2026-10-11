import type { AppModule } from '../../core/module'
import { muscuRoute } from './routes'
import { useSummary } from './summary'

export const muscuModule: AppModule = {
  path: '/muscu',
  label: 'Muscu',
  icon: 'dumbbell',
  route: muscuRoute,
  useSummary,
}
