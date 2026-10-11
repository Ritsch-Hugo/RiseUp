import type { RouteObject } from 'react-router-dom'
import { ModuleLayout, type Tab } from '../../core/ui'
import { FoodFormPage } from './foods/FoodFormPage'
import { FoodPage } from './foods/FoodPage'
import { FoodsPage } from './foods/FoodsPage'
import { JournalPage } from './journal/JournalPage'
import { MealFormPage } from './meals/MealFormPage'
import { WaterPage } from './water/WaterPage'
import { GoalsPage } from './goals/GoalsPage'
import { StatsPage } from './stats/StatsPage'

const tabs: Tab[] = [
  { to: '/nutrition', label: 'Journal', icon: 'book', end: true },
  { to: '/nutrition/aliments', label: 'Aliments', icon: 'apple' },
  { to: '/nutrition/stats', label: 'Stats', icon: 'chart' },
]

export const nutritionRoute: RouteObject = {
  path: 'nutrition',
  element: <ModuleLayout title="Nutrition" tabs={tabs} />,
  children: [
    { index: true, element: <JournalPage /> },
    { path: 'repas/nouveau', element: <MealFormPage /> },
    { path: 'repas/:id', element: <MealFormPage /> },
    { path: 'eau', element: <WaterPage /> },
    { path: 'aliments', element: <FoodsPage /> },
    { path: 'aliments/nouveau', element: <FoodFormPage /> },
    { path: 'aliments/:id', element: <FoodPage /> },
    { path: 'aliments/:id/modifier', element: <FoodFormPage /> },
    { path: 'stats', element: <StatsPage /> },
    { path: 'stats/objectifs', element: <GoalsPage /> },
  ],
}
