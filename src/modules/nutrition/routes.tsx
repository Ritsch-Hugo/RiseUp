import type { RouteObject } from 'react-router-dom'
import { FoodFormPage } from './foods/FoodFormPage'
import { FoodPage } from './foods/FoodPage'
import { FoodsPage } from './foods/FoodsPage'
import { ScanPage } from './off/ScanPage'
import { JournalPage } from './journal/JournalPage'
import { MealFormPage } from './meals/MealFormPage'
import { WaterPage } from './water/WaterPage'
import { GoalsPage } from './goals/GoalsPage'
import { NutritionLayout } from './NutritionLayout'
import { StatsPage } from './stats/StatsPage'

export const nutritionRoute: RouteObject = {
  path: 'nutrition',
  element: <NutritionLayout />,
  children: [
    { index: true, element: <JournalPage /> },
    { path: 'repas/nouveau', element: <MealFormPage /> },
    { path: 'repas/:id', element: <MealFormPage /> },
    { path: 'scan', element: <ScanPage /> },
    { path: 'eau', element: <WaterPage /> },
    { path: 'aliments', element: <FoodsPage /> },
    { path: 'aliments/nouveau', element: <FoodFormPage /> },
    { path: 'aliments/:id', element: <FoodPage /> },
    { path: 'aliments/:id/modifier', element: <FoodFormPage /> },
    { path: 'stats', element: <StatsPage /> },
    { path: 'stats/objectifs', element: <GoalsPage /> },
  ],
}
