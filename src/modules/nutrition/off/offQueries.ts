import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../core'
import { useSaveFood } from '../foods/foodQueries'
import { isBarcode, offToFood, offToFoodRow, type OffFood, type OffProduct } from '../rules/off'

const OFF_PRODUCT_URL = 'https://world.openfoodfacts.org/api/v2/product'
const OFF_FIELDS = 'code,product_name,brands,quantity,serving_quantity,nutriments'
const APP_PARAMS = 'app_name=riseup&app_version=1'

/** Recherche texte via l'Edge Function `off-search` (ADR-016) ; ne garde que les produits exploitables. */
export function useOffSearch() {
  return useMutation({
    mutationFn: async (query: string): Promise<OffFood[]> => {
      const { data, error } = await supabase.functions.invoke('off-search', { body: { q: query } })
      if (error) throw error
      const hits: OffProduct[] = Array.isArray(data?.hits) ? data.hits : []
      return hits.flatMap((h) => offToFood(h) ?? [])
    },
  })
}

/** Produit par code-barres, appel direct à OFF (ADR-013) ; null si OFF ne le connaît pas. */
export async function fetchOffProduct(barcode: string): Promise<OffFood | null> {
  if (!isBarcode(barcode)) return null
  const res = await fetch(
    `${OFF_PRODUCT_URL}/${barcode.trim()}.json?fields=${OFF_FIELDS}&${APP_PARAMS}`
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`OFF ${res.status}`)
  const body = (await res.json()) as { status?: number; product?: OffProduct }
  if (body.status === 0 || !body.product) return null
  return offToFood({ ...body.product, code: body.product.code ?? barcode.trim() })
}

/** Actions sur un produit OFF : l'enregistrer comme aliment puis ouvrir sa fiche, ou le corriger avant. */
export function useOffActions(search: string) {
  const navigate = useNavigate()
  const save = useSaveFood()
  return {
    saving: save.isPending,
    failed: save.isError,
    add: (food: OffFood) =>
      save.mutate(
        { values: offToFoodRow(food) },
        { onSuccess: (id) => navigate(`/nutrition/aliments/${id}${search}`, { replace: true }) }
      ),
    edit: (food: OffFood) =>
      navigate(`/nutrition/aliments/nouveau${search}`, { state: { off: food } }),
  }
}
