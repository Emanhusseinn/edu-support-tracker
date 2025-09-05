export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;        // https://xxxx.supabase.co
const ANON_KEY      = process.env.SUPABASE_ANON_KEY;   // anon key

export default async function handler(req) {
  const url = new URL(req.url);
  // شيل /api/sb من البداية وخلي الباقي يروح لـ Supabase كما هو:
  const upstreamPath = url.pathname.replace(/^\/api\/sb/, '');
  const target = new URL(upstreamPath + url.search, SUPABASE_URL);

  // مرر الهيدرز مع apikey + Authorization
  const headers = new Headers(req.headers);
  headers.set('apikey', ANON_KEY);
  headers.set('Authorization', `Bearer ${ANON_KEY}`);
  headers.delete('host');

  const init = {
    method: req.method,
    headers,
    body: (req.method === 'GET' || req.method === 'HEAD') ? undefined : await req.text(),
    redirect: 'manual',
  };

  const upstream = await fetch(target, init);

  // رجّع الاستجابة كما هي
  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
