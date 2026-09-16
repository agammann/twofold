import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { createHostedHandler, reserveSql, DAILY_LIMIT } from '../server/hosted.mjs';

function database() {
  const sql = new DatabaseSync(':memory:');
  sql.exec(readFileSync(new URL('../drizzle/0000_redundant_carnage.sql', import.meta.url), 'utf8'));
  return { sql, prepare(query) { return { bind(...args) { return { async first() { return sql.prepare(query).get(...args); } }; } }; } };
}
const input = { question: 'What is 2 + 2?', answerA: '4.', answerB: '5.', web: false };
const request = (body = input, extra = {}) => new Request('https://twofold.example/api/compare', { method: 'POST', headers: { Origin: 'https://twofold.example', 'Content-Type': 'application/json', 'X-Twofold-Token': 'public', ...extra }, body: JSON.stringify(body) });

test('hosted quota atomically caps global usage, spaces calls, and resets on the UTC day', async () => {
  const db = database(), base = Date.parse('2026-09-16T01:00:00Z');
  try {
    const reserve = (day, at) => db.prepare(reserveSql).bind(day, at, DAILY_LIMIT).first();
    assert.equal((await reserve('2026-09-16', base)).used, 1);
    assert.equal(await reserve('2026-09-16', base + 9999), undefined);
    for (let i = 1; i < DAILY_LIMIT; i++) assert.equal((await reserve('2026-09-16', base + i * 10000)).used, i + 1);
    assert.equal(await reserve('2026-09-16', base + 3600000), undefined);
    assert.equal((await reserve('2026-09-17', base + 86400000)).used, 1);
    assert.equal(db.sql.prepare('SELECT count(*) AS count FROM public_usage').get().count, 1);
  } finally { db.sql.close(); }
});

test('hosted request checks reject cross origin, invalid and oversized input before provider or quota use', async () => {
  const db = database(); let calls = 0;
  const handler = createHostedHandler({}, { runEvaluation: async () => { calls++; return {}; } });
  const env = { DB: db, OPENAI_API_KEY: 'synthetic-test-value' };
  try {
    assert.equal((await handler.fetch(request(input, { Origin: 'https://other.example' }), env)).status, 403);
    assert.equal((await handler.fetch(request({ ...input, answerA: '' }), env)).status, 400);
    assert.equal((await handler.fetch(request({ ...input, answerA: 'x'.repeat(70000) }), env)).status, 413);
    assert.equal(calls, 0);
    assert.equal(db.sql.prepare('SELECT count(*) AS count FROM public_usage').get().count, 0);
  } finally { db.sql.close(); }
});

test('hosted failures consume a slot, hide provider diagnostics, and fail closed without durable limits', async () => {
  const db = database(); const secret = 'synthetic-private-value'; let calls = 0;
  const handler = createHostedHandler({}, { runEvaluation: async () => { calls++; throw Error(secret); } });
  try {
    const result = await handler.fetch(request(), { DB: db, OPENAI_API_KEY: secret });
    assert.equal(result.status, 503); assert.equal((await result.text()).includes(secret), false);
    assert.equal(db.sql.prepare('SELECT used FROM public_usage').get().used, 1);
    const blocked = await handler.fetch(request(), { OPENAI_API_KEY: secret });
    assert.equal(blocked.status, 503); assert.equal(calls, 1);
  } finally { db.sql.close(); }
});

test('hosted status and static allowlist never expose server files or secrets', async () => {
  const handler = createHostedHandler({ '/': { type: 'text/html', data: btoa('<h1>Twofold</h1>') } });
  const env = { DB: {}, OPENAI_API_KEY: 'synthetic-private-value' };
  const status = await handler.fetch(new Request('https://twofold.example/api/status'), env);
  const data = await status.json(); assert.equal(data.hosted, true); assert.equal(data.configured, true);
  assert.equal(JSON.stringify(data).includes(env.OPENAI_API_KEY), false);
  for (const path of ['/.env.local', '/server/index.js', '/.openai/hosting.json', '/db/schema.ts']) assert.equal((await handler.fetch(new Request('https://twofold.example' + path), env)).status, 404);
  const home = await handler.fetch(new Request('https://twofold.example/'), env);
  assert.match(await home.text(), /Twofold/); assert.match(home.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
});
