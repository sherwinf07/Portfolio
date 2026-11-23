const FORMSPREE_URL = 'https://formspree.io/f/xbgoprpg';
const ALLOWED_ORIGIN = 'https://YOUR-SITE-DOMAIN'; // exact origin, no trailing slash

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept',
    };
    const json = (body, status) =>
      new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const form = await request.formData();
    const token = form.get('cf-turnstile-response');
    if (!token) return json({ error: 'Missing captcha' }, 400);

    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP') || '',
      }),
    });
    const result = await verify.json();
    if (!result.success) return json({ error: 'Captcha failed' }, 403);

    form.delete('cf-turnstile-response');
    const upstream = await fetch(FORMSPREE_URL, {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
    });
    return json({ ok: upstream.ok }, upstream.ok ? 200 : 502);
  },
};
