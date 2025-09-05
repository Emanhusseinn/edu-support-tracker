import { createClient } from '@supabase/supabase-js'

const url = process.env.REACT_APP_SUPABASE_URL
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('❌ Supabase ENV missing:', { urlPresent: !!url, keyPresent: !!anonKey })
  throw new Error('Missing REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY at build time')
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})