import type { AppModule } from '../../core/module'
import { nutritionRoute } from './routes'
import { useSummary } from './summary'

export const nutritionModule: AppModule = {
  path: '/nutrition',
  label: 'Nutrition',
  icon: 'apple',
  route: nutritionRoute,
  useSummary,
}
