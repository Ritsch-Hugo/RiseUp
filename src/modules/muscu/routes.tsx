import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ListSkeleton } from '../../core/ui'

const MuscuApp = lazy(() => import('./MuscuApp'))

export const muscuRoute: RouteObject = {
  path: 'muscu/*',
  element: (
    <Suspense fallback={<ListSkeleton />}>
      <MuscuApp />
    </Suspense>
  ),
}
