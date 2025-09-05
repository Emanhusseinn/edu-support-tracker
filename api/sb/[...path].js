// /api/sb/[...path].js
export const config = { runtime: 'edge' };

const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON_KEY     = process.env.SUPABASE_ANON_KEY;

export default async function handler(req) {
  const url = new URL(req.url);
  const upstreamPath = url.pathname.replace(/^\/api\/sb/, '');
  const target = new URL(upstreamPath + url.search, SUPABASE_URL);

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

  const res = await fetch(target.toString(), init);
  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}
