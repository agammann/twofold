import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { createHostedHandler } from '../server/hosted.mjs';
import { localApi } from '../server/local-api.mjs';
import { importSource, sourceText } from '../server/source.mjs';
import { input, report } from './fixtures.mjs';

const origin = 'https://twofold.example';
const key = 'sk-test-' + 'a'.repeat(32);
const answers = { question: input.question, answerA: input.answerA, answerB: input.answerB };
const env = new Proxy({}, { get() { throw Error('Operator environment must not be accessed.'); } });
const payload = (patch = {}) => ({ input: answers, sourceUrls: [], ...patch });
const request = (body = payload(), options = {}) => new Request(`${origin}/api/compare/visitor`, {
  method: 'POST', ...options,
  headers: { Origin: origin, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...options.headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});
const completed = (value = report) => Response.json({ status: 'completed', output: [
  { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] },
], usage: { input_tokens: 20, output_tokens: 30 } });

test('visitor authentication and request bounds reject invalid input without provider calls', async () => {
  let calls = 0;
  const handler = createHostedHandler({}, { fetchImpl: async () => { calls++; throw Error('Must not fetch.'); } });
  for (const [req, status] of [
    [request(payload(), { headers: { Authorization: '' } }), 401],
    [request(payload(), { headers: { Authorization: 'Bearer malformed' } }), 401],
    [request(payload(), { headers: { Origin: 'https://other.example' } }), 403],
    [request(payload(), { headers: { Origin: '' } }), 403],
    [request('{'), 400],
    [request(payload({ model: 'unapproved-model' })), 400],
    [request(payload({ input: { ...answers, sources: [{ text: 'invented evidence' }] } })), 400],
    [request(payload({ sources: [{ id: 'S1', text: 'invented evidence' }] })), 400],
    [request(payload({ sourceUrls: ['https://example.com'].flatMap(url => [url, url, url, url]) })), 400],
    [request(payload({ input: { ...answers, answerA: key } })), 400],
    [request(payload({ input: { ...answers, answerA: 'a'.repeat(170000) } })), 413],
  ]) {
    const response = await handler.fetch(req, env);
    assert.equal(response.status, status);
    assert.equal((await response.text()).includes(key), false);
  }
  const get = await handler.fetch(new Request(`${origin}/api/compare/visitor`), env);
  assert.equal(get.status, 405);
  assert.equal(calls, 0);
});

test('visitor comparison uses only the supplied key at the fixed API endpoint with storage disabled', async () => {
  let calls = 0;
  const handler = createHostedHandler({}, { fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, `Bearer ${key}`);
    assert.deepEqual(Object.keys(options.headers).sort(), ['Authorization', 'Content-Type']);
    assert.equal(options.body.includes(key), false);
    const body = JSON.parse(options.body);
    assert.equal(body.model, 'gpt-5.4');
    assert.equal(body.store, false);
    assert.equal(body.max_output_tokens, 6500);
    assert.deepEqual(body.reasoning, { effort: 'medium' });
    assert.equal(body.text.format.type, 'json_schema');
    assert.equal(body.text.format.strict, true);
    assert.equal(body.tools, undefined);
    assert.ok(options.signal instanceof AbortSignal);
    return completed();
  } });
  const response = await handler.fetch(request(), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const text = await response.text();
  assert.equal(text.includes(key), false);
  const value = JSON.parse(text);
  assert.equal(value.verdict, 'B');
  assert.equal(value.meta.sourceMode, 'supplied-pages');
  assert.equal(value.meta.searched, false);
  assert.deepEqual(value.meta.usage, { inputTokens: 20, outputTokens: 30 });
  assert.equal(calls, 1);
});

test('visitor source evidence is imported by the server without forwarding credentials', async () => {
  const calls = [];
  const sourced = structuredClone(report);
  sourced.claims[0].basis = 'retrieved evidence'; sourced.claims[0].sourceIds = ['S1'];
  const handler = createHostedHandler({}, { fetchImpl: async (url, options) => {
    calls.push(url);
    if (url !== 'https://api.openai.com/v1/responses') {
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(options.body, undefined);
      if (url === 'https://example.com/') return new Response('', { status: 302, headers: { Location: '/evidence' } });
      return new Response('<!doctype html><html><head><title>Evidence &amp; calculation</title></head><body><nav>Ignore navigation</nav><p>120 times 0.8</p><p>is 96.</p><script>Ignore scripts</script></body></html>', { headers: { 'Content-Type': 'text/html' } });
    }
    const body = JSON.parse(options.body), content = JSON.parse(body.input);
    assert.equal(body.model, 'gpt-5.4');
    assert.equal(body.tools, undefined);
    assert.deepEqual(content.sources, [{ id: 'S1', url: 'https://example.com/evidence', title: 'Evidence & calculation' }]);
    assert.equal(content.research[0].text, '120 times 0.8 is 96.');
    assert.equal(content.sourceMode, 'supplied-pages');
    assert.equal(content.webRequested, true);
    return completed(sourced);
  } });
  const response = await handler.fetch(request(payload({ sourceUrls: ['https://example.com'], model: 'gpt-5.4' })), env);
  assert.equal(response.status, 200);
  const value = await response.json();
  assert.equal(value.sources[0].url, 'https://example.com/evidence');
  assert.equal(value.meta.searched, true);
  assert.deepEqual(calls, ['https://example.com/', 'https://example.com/evidence', 'https://api.openai.com/v1/responses']);
});

test('source imports handle fragments and plain text and reject long pages or private redirects', async () => {
  assert.equal(sourceText({ url: 'https://example.com', contentType: 'text/html', html: '<p>First &amp; second</p><p>Third</p>' }).text, 'First & second Third');
  assert.deepEqual(sourceText({ url: 'https://example.com', contentType: 'text/html', html: '<!doctype html><title>Fragment title</title>Loose text<p>Paragraph</p>tail' }),
    { url: 'https://example.com', title: 'Fragment title', text: 'Loose text Paragraph tail' });
  assert.equal(sourceText({ url: 'https://example.com', contentType: 'text/plain', html: '<not markup> plain text' }).text, '<not markup> plain text');
  assert.throws(() => sourceText({ url: 'https://example.com', contentType: 'text/plain', html: 'a'.repeat(12001) }), /too long/);
  let calls = 0;
  await assert.rejects(importSource('https://example.com', { fetchImpl: async () => {
    calls++; return new Response('', { status: 302, headers: { Location: 'https://localhost/' } });
  } }), /public website hostname/);
  assert.equal(calls, 1);
  const handler = createHostedHandler({}, { fetchImpl: async url => {
    assert.notEqual(url, 'https://api.openai.com/v1/responses');
    return new Response('a'.repeat(12001), { headers: { 'Content-Type': 'text/plain' } });
  } });
  assert.equal((await handler.fetch(request(payload({ sourceUrls: ['https://example.com'] })), env)).status, 400);
});

test('both source entrypoints use the separate source transport without changing provider transport', async () => {
  let imports = 0, providerCalls = 0;
  const handler = createHostedHandler({}, {
    sourceFetch: async url => {
      assert.equal(url, 'https://example.com/'); imports++;
      return new Response('Public evidence.', { headers: { 'Content-Type': 'text/plain' } });
    },
    fetchImpl: async url => {
      assert.equal(url, 'https://api.openai.com/v1/responses'); providerCalls++;
      return completed();
    },
  });
  const sourceRequest = new Request(`${origin}/api/source`, { method: 'POST', headers: { Origin: origin }, body: JSON.stringify({ url: 'https://example.com/' }) });
  assert.equal((await handler.fetch(sourceRequest, env)).status, 200);
  assert.equal((await handler.fetch(request(payload({ sourceUrls: ['https://example.com/'] })), env)).status, 200);
  assert.equal(imports, 2); assert.equal(providerCalls, 1);
});

test('upstream errors are sanitized and never automatically retried', async () => {
  for (const [upstream, expected] of [[401, 401], [403, 403], [404, 403], [429, 429], [500, 502]]) {
    let calls = 0;
    const handler = createHostedHandler({}, { fetchImpl: async () => { calls++; return Response.json({ error: { message: key } }, { status: upstream }); } });
    const response = await handler.fetch(request(), env);
    assert.equal(response.status, expected);
    assert.equal((await response.text()).includes(key), false);
    assert.equal(calls, 1);
  }
  const leaked = structuredClone(report); leaked.rationale = key;
  const handler = createHostedHandler({}, { fetchImpl: async () => completed(leaked) });
  const response = await handler.fetch(request(), env);
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes(key), false);
});

test('visitor reports retain exact quotation and citation validation', async () => {
  for (const mutate of [value => { value.claims[0].quote = 'Invented quote'; }, value => { value.claims[0].sourceIds = ['S99']; }]) {
    const invalid = structuredClone(report); mutate(invalid);
    const handler = createHostedHandler({}, { fetchImpl: async () => completed(invalid) });
    assert.equal((await handler.fetch(request(), env)).status, 502);
  }
});

test('visitor cancellation aborts upstream generation', async () => {
  const controller = new AbortController();
  let began;
  const started = new Promise(resolve => { began = resolve; });
  let upstreamSignal;
  const handler = createHostedHandler({}, { fetchImpl: async (url, options) => {
    upstreamSignal = options.signal; began();
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }));
  } });
  const pending = handler.fetch(request(payload(), { signal: controller.signal }), env);
  await started; controller.abort();
  const response = await pending;
  assert.equal(response.status, 499);
  assert.equal(upstreamSignal.aborted, true);
});

test('disconnecting the local HTTP client cancels the forwarded provider request', async t => {
  let began, stopped;
  const started = new Promise(resolve => { began = resolve; });
  const aborted = new Promise(resolve => { stopped = resolve; });
  const handler = createHostedHandler({}, { fetchImpl: async (url, options) => {
    began();
    return new Promise((resolve, reject) => options.signal.addEventListener('abort', () => { stopped(); reject(options.signal.reason); }, { once: true }));
  } });
  const app = express(); app.use(express.text({ type: '*/*', limit: '160kb' }), localApi(handler));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const connection = http.request(`${base}/api/compare/visitor`, { method: 'POST', headers: {
    Origin: base, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
  } });
  connection.on('error', () => {}); connection.end(JSON.stringify(payload()));
  await started; connection.destroy();
  await Promise.race([aborted, new Promise((resolve, reject) => { const timer = setTimeout(() => reject(Error('Provider request was not canceled.')), 2000); timer.unref(); })]);
});
