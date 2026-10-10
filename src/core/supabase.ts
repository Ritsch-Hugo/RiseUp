import { createClient } from '@supabase/supabase-js'
import type { Database } from './db.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis (.env.local)')
}

export const supabase = createClient<Database>(url, anonKey)
