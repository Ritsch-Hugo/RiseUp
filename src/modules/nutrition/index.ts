import type { AppModule } from '../../core/module'
import { COLORS } from './config'
import { nutritionRoute } from './routes'
import { useSummary } from './summary'

export const nutritionModule: AppModule = {
  path: '/nutrition',
  label: 'Nutrition',
  icon: 'apple',
  colors: COLORS,
  route: nutritionRoute,
  useSummary,
}
