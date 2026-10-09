import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être définis (.env.local)')
}

// TODO : typer avec `createClient<Database>` une fois src/core/db.types.ts généré (1res tables).
export const supabase = createClient(url, anonKey)
