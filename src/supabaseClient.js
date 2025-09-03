import { createClient } from '@supabase/supabase-js'

const url = process.env.REACT_APP_SUPABASE_URL
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('Supabase ENV missing:', { url, anonKey: !!anonKey })
  alert('ENV missing: REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY');
}
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

