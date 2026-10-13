import type { AppModule } from '../../core/module'
import { COLORS } from './config'
import { muscuRoute } from './routes'
import { useSummary } from './summary'

export const muscuModule: AppModule = {
  path: '/muscu',
  label: 'Muscu',
  icon: 'dumbbell',
  colors: COLORS,
  route: muscuRoute,
  useSummary,
}
