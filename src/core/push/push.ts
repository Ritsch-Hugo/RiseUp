import { supabase } from '../supabase'

/** Clé publique VAPID (publique par nature) ; la clé privée n'existe que dans les secrets de l'Edge Function. */
const VAPID_PUBLIC_KEY =
  'BFMU2f1Xdci3auKJIE4SLE6nV0mrOxoOI7Xaq41lj4W2yNUFdbkd-sm-r0pMtyOEJ8HDIwnrR7G5W0vkvzw3B08'

export type PushState = 'unsupported' | 'denied' | 'off' | 'on'

export const pushSupported = (): boolean =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

/** Clé VAPID (base64url) au format attendu par `subscribe`. */
function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padded = base64Url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(base64Url.length / 4) * 4, '=')
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

/** État sur cet appareil : non géré, refusé, désactivé, ou activé (abonnement présent). */
export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  return (await currentSubscription()) ? 'on' : 'off'
}

/** Demande l'autorisation, s'abonne et enregistre l'abonnement. Renvoie le nouvel état. */
export async function enablePush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'
  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(VAPID_PUBLIC_KEY),
    }))
  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      id: crypto.randomUUID(),
      endpoint: subscription.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
      device_label: navigator.userAgent.slice(0, 120),
    },
    { onConflict: 'user_id,endpoint', ignoreDuplicates: true }
  )
  if (error) {
    await subscription.unsubscribe()
    throw error
  }
  return 'on'
}

/** Se désabonne sur cet appareil et supprime l'abonnement enregistré. */
export async function disablePush(): Promise<PushState> {
  const subscription = await currentSubscription()
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
  }
  return 'off'
}

/** Demande à l'Edge Function d'envoyer une notification d'essai à tous mes appareils. */
export async function sendTestPush(): Promise<number> {
  const { data, error } = await supabase.functions.invoke<{ sent: number }>('send-reminders', {
    body: { test: true },
  })
  if (error) throw error
  return data?.sent ?? 0
}
