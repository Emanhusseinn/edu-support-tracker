import { createClient } from '@supabase/supabase-js'

const isProd = process.env.NODE_ENV === 'production'

// إذا في production → استخدم البروكسي /api/sb
// إذا في development → استخدم رابط Supabase من env
const url = isProd ? '/api/sb' : process.env.REACT_APP_SUPABASE_URL

const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('❌ Supabase ENV missing:', { urlPresent: !!url, keyPresent: !!anonKey })
  throw new Error('Missing REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY at build time')
}
console.log("NODE_ENV =", process.env.NODE_ENV);
console.log("SUPABASE URL =", url);

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})
