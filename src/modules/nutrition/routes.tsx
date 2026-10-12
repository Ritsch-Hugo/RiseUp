import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ListSkeleton } from '../../core/ui'

const NutritionApp = lazy(() => import('./NutritionApp'))

export const nutritionRoute: RouteObject = {
  path: 'nutrition/*',
  element: (
    <Suspense fallback={<ListSkeleton />}>
      <NutritionApp />
    </Suspense>
  ),
}
