import { lazy, Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ListSkeleton } from '../../core/ui'

const TachesApp = lazy(() => import('./TachesApp'))

export const tachesRoute: RouteObject = {
  path: 'taches/*',
  element: (
    <Suspense fallback={<ListSkeleton />}>
      <TachesApp />
    </Suspense>
  ),
}
