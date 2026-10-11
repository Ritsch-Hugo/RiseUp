// Rappels d'habitude par Web Push (ADR-014).
// - Appelée chaque minute par pg_cron (en-tête x-cron-secret) : envoie les rappels dus à cette minute.
// - Appelée par l'appli avec { test: true } et le jeton de l'utilisateur : envoie une notification d'essai.
// La vérification JWT de la plateforme reste active (le cron envoie la clé anon).
import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

const sameSecret = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

type Payload = { title: string; body: string; url: string; tag: string }

/** Envoie à tous les appareils de l'utilisateur ; supprime les abonnements expirés. Renvoie le nombre d'envois réussis. */
async function pushToUser(userId: string, payload: Payload): Promise<number> {
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)
  if (error) throw error
  let sent = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 3600 }
      )
      sent++
    } catch (e) {
      const status = (e as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await admin.from('push_subscriptions').delete().eq('id', s.id)
      } else {
        console.error('push failed', status)
      }
    }
  }
  return sent
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const cronSecret = Deno.env.get('CRON_SECRET') ?? ''
  const given = req.headers.get('x-cron-secret') ?? ''
  if (cronSecret !== '' && sameSecret(given, cronSecret)) {
    const { data: due, error } = await admin.rpc('taches_due_reminders')
    if (error) return json({ error: 'rpc_failed' }, 500)
    let sent = 0
    for (const r of due ?? []) {
      sent += await pushToUser(r.user_id, {
        title: 'Rappel',
        body: r.name,
        url: '/taches',
        tag: `habit-${r.habit_id}`,
      })
    }
    return json({ due: due?.length ?? 0, sent })
  }

  // Notification d'essai : réservée à un utilisateur connecté.
  const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: auth, error: authError } = await userClient.auth.getUser()
  if (authError || !auth.user) return json({ error: 'unauthorized' }, 401)
  const body = await req.json().catch(() => ({}))
  if (body?.test !== true) return json({ error: 'bad_request' }, 400)
  const sent = await pushToUser(auth.user.id, {
    title: 'RiseUp',
    body: 'Les notifications fonctionnent sur cet appareil.',
    url: '/taches',
    tag: 'test',
  })
  return json({ sent })
})
