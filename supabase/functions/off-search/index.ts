// Proxy de recherche Open Food Facts (ADR-016).
// Le moteur de recherche d'OFF n'autorise pas les appels depuis le navigateur (pas d'en-tête CORS) :
// le téléphone appelle cette fonction, qui interroge OFF avec un User-Agent d'identification.
// Réservé à un utilisateur connecté (la clé anon publique ne suffit pas).
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const OFF_SEARCH = 'https://search.openfoodfacts.org/search'
const FIELDS = 'code,product_name,brands,quantity,serving_quantity,nutriments'
const USER_AGENT = 'RiseUp/1.0 (application personnelle ; https://riseup-1ku.pages.dev)'
const PAGE_SIZE = 20
const MIN_QUERY = 2
const MAX_QUERY = 100

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return json({ error: 'unauthorized' }, 401)

  let query = ''
  try {
    const body = await req.json()
    query = typeof body?.q === 'string' ? body.q.trim() : ''
  } catch {
    return json({ error: 'bad_request' }, 400)
  }
  if (query.length < MIN_QUERY || query.length > MAX_QUERY) return json({ error: 'bad_query' }, 400)

  const url = new URL(OFF_SEARCH)
  url.searchParams.set('q', query)
  url.searchParams.set('langs', 'fr')
  url.searchParams.set('page_size', String(PAGE_SIZE))
  url.searchParams.set('fields', FIELDS)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return json({ error: 'upstream', status: res.status }, 502)
    const payload = await res.json()
    return json({ hits: Array.isArray(payload?.hits) ? payload.hits : [] })
  } catch {
    return json({ error: 'upstream_unreachable' }, 502)
  }
})
