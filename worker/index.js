const FORMSPREE_URL = 'https://formspree.io/f/xbgoprpg';
const ALLOWED_ORIGIN = 'https://portfolio.thefrias.net';

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
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return json({ error: 'Origin not allowed' }, 403);

    try {
      const form = await request.formData();
      const token = form.get('cf-turnstile-response');
      if (typeof token !== 'string' || !token) return json({ error: 'Missing captcha' }, 400);
      if (form.get('_gotcha')) return json({ error: 'Invalid submission' }, 400);

      const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: new URLSearchParams({
          secret: env.TURNSTILE_SECRET,
          response: token,
          remoteip: request.headers.get('CF-Connecting-IP') || '',
        }),
      });
      if (!verify.ok) throw new Error(`Turnstile verification failed: ${verify.status}`);
      const result = await verify.json();
      if (!result.success) return json({ error: 'Captcha failed' }, 403);

      form.delete('cf-turnstile-response');
      form.delete('_gotcha');
      const upstream = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: form,
        headers: { Accept: 'application/json', Referer: `${ALLOWED_ORIGIN}/` },
      });
      const response = await upstream.json();
      if (!upstream.ok || response.ok !== true) {
        console.error('Formspree rejected the submission:', upstream.status);
        return json({ error: 'Formspree did not accept the submission' }, 502);
      }
      return json({ ok: true }, 200);
    } catch (error) {
      console.error('Contact submission failed:', error);
      return json({ error: 'Submission failed' }, 502);
    }
  },
};
