const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class MockResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = options.headers;
  }

  async json() {
    return JSON.parse(this.body);
  }
}

const source = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const context = { Response: MockResponse, URLSearchParams, console, fetch: null };
vm.runInNewContext(source.replace('export default', 'worker ='), context);

function request(fields, origin = 'https://portfolio.thefrias.net') {
  const form = new Map(Object.entries(fields));
  return {
    method: 'POST',
    headers: { get: name => name === 'Origin' ? origin : null },
    formData: async () => form,
  };
}

async function run() {
  const calls = [];
  context.fetch = async (url, options) => {
    calls.push({ url, options });
    return new MockResponse(JSON.stringify(calls.length === 1 ? { success: true } : { ok: true }));
  };
  const env = { TURNSTILE_SECRET: 'test-secret' };
  let response = await context.worker.fetch(request({
    'cf-turnstile-response': 'token',
    _gotcha: '',
    message: 'Hello',
  }), env);
  assert.strictEqual(response.status, 200);
  assert.strictEqual((await response.json()).ok, true);
  assert.strictEqual(calls.length, 2);
  assert.strictEqual(calls[1].options.headers.Referer, 'https://portfolio.thefrias.net/');
  assert.strictEqual(calls[1].options.body.get('message'), 'Hello');
  assert.strictEqual(calls[1].options.body.has('cf-turnstile-response'), false);
  assert.strictEqual(calls[1].options.body.has('_gotcha'), false);

  calls.length = 0;
  response = await context.worker.fetch(request({ message: 'Hello' }), env);
  assert.strictEqual(response.status, 400);
  response = await context.worker.fetch(request({ 'cf-turnstile-response': 'token', _gotcha: 'spam' }), env);
  assert.strictEqual(response.status, 400);
  response = await context.worker.fetch(request({ 'cf-turnstile-response': 'token' }, 'https://example.com'), env);
  assert.strictEqual(response.status, 403);
  assert.strictEqual(calls.length, 0);

  context.fetch = async url => new MockResponse(JSON.stringify(
    url.includes('siteverify') ? { success: false } : { ok: true }
  ));
  response = await context.worker.fetch(request({ 'cf-turnstile-response': 'token' }), env);
  assert.strictEqual(response.status, 403);

  context.fetch = async url => new MockResponse(JSON.stringify(
    url.includes('siteverify') ? { success: true } : { ok: false }
  ));
  response = await context.worker.fetch(request({ 'cf-turnstile-response': 'token' }), env);
  assert.strictEqual(response.status, 502);
  assert.notStrictEqual((await response.json()).ok, true);

  console.log('Worker tests passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
