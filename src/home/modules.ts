import type { AppModule } from '../core/module'
import { muscuModule } from '../modules/muscu'
import { nutritionModule } from '../modules/nutrition'
import { tachesModule } from '../modules/taches'

export const modules: AppModule[] = [muscuModule, nutritionModule, tachesModule]
