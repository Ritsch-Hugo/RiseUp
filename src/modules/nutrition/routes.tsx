import type { RouteObject } from 'react-router-dom'
import { ComingSoon, ModuleLayout, type Tab } from '../../core/ui'

const tabs: Tab[] = [
  { to: '/nutrition', label: 'Journal', icon: 'book', end: true },
  { to: '/nutrition/aliments', label: 'Aliments', icon: 'apple' },
  { to: '/nutrition/stats', label: 'Stats', icon: 'chart' },
]

export const nutritionRoute: RouteObject = {
  path: 'nutrition',
  element: <ModuleLayout title="Nutrition" tabs={tabs} />,
  children: [
    { index: true, element: <ComingSoon name="Journal" /> },
    { path: 'aliments', element: <ComingSoon name="Aliments" /> },
    { path: 'stats', element: <ComingSoon name="Stats" /> },
  ],
}
