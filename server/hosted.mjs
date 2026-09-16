import OpenAI from 'openai';
import { Input } from '../shared/schema.mjs';
import { evaluate, EvaluationError } from './evaluate.mjs';

export const DAILY_LIMIT = 30;
export const reserveSql = `INSERT INTO public_usage (id, day, used, last_started)
VALUES (1, ?, 1, ?)
ON CONFLICT(id) DO UPDATE SET day = excluded.day,
used = CASE WHEN public_usage.day = excluded.day THEN public_usage.used + 1 ELSE 1 END,
last_started = excluded.last_started
WHERE (public_usage.day != excluded.day OR public_usage.used < ?)
AND public_usage.last_started <= excluded.last_started - 10000
RETURNING used`;

const headers = {
  'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY', 'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};
const json = (data, status = 200, extra = {}) => Response.json(data, { status, headers: { ...headers, ...extra } });

async function boundedJson(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new EvaluationError('A question and two answers are required.', 400);
  const chunks = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > 65536) { await reader.cancel(); throw new EvaluationError('The request is too large. Shorten your answers.', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new EvaluationError('The request contains invalid JSON.', 400); }
}

export function createHostedHandler(assets = {}, { runEvaluation = evaluate, now = Date.now } = {}) {
  return { async fetch(request, env) {
    const url = new URL(request.url);
    const configured = Boolean(env.OPENAI_API_KEY && env.DB);
    if (request.method === 'GET' && url.pathname === '/api/status') {
      return json({ configured, hosted: true, model: 'gpt-5.4-mini', token: 'public', dailyLimit: DAILY_LIMIT });
    }
    if (url.pathname === '/api/compare' && request.method === 'POST') {
      if (request.headers.get('Origin') !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site' || request.headers.get('X-Twofold-Token') !== 'public') return json({ error: 'Open Twofold and compare from this page.' }, 403);
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return json({ error: 'Send a JSON request.' }, 415);
      if (!configured) return json({ error: 'Comparisons are temporarily unavailable. Please try again later.' }, 503);
      try {
        const parsed = Input.safeParse(await boundedJson(request));
        if (!parsed.success) return json({ error: 'Enter a question and two answers within the displayed limits.' }, 400);
        const started = now(), day = new Date(started).toISOString().slice(0, 10);
        // One atomic statement enforces a shared limit across all Worker instances.
        // Reserve before calling OpenAI; failures and cancellation still consume a slot.
        const reserved = await env.DB.prepare(reserveSql).bind(day, started, DAILY_LIMIT).first();
        if (!reserved) return json({ error: 'Public comparisons are limited to one every 10 seconds and 30 per day. Wait briefly, or return after the daily reset at midnight UTC. You can also run your own copy from GitHub.' }, 429, { 'Retry-After': '10' });
        const client = new OpenAI({ apiKey: env.OPENAI_API_KEY, baseURL: 'https://api.openai.com/v1', maxRetries: 0, timeout: 175000 });
        const result = await runEvaluation(parsed.data, { client, model: 'gpt-5.4-mini', signal: AbortSignal.any([request.signal, AbortSignal.timeout(180000)]) });
        return json(result);
      } catch (error) {
        if (error instanceof EvaluationError) return json({ error: error.message }, error.status);
        if (error.name === 'TimeoutError' || error.name === 'AbortError') return json({ error: 'The comparison timed out or was canceled. Try shorter answers.' }, 504);
        return json({ error: 'The comparison service is temporarily unavailable. Please try again later.' }, 503);
      }
    }
    if (request.method === 'GET' || request.method === 'HEAD') {
      const asset = assets[url.pathname];
      if (asset) return new Response(request.method === 'HEAD' ? null : Uint8Array.from(atob(asset.data), c => c.charCodeAt(0)), { headers: { ...headers, 'Content-Type': asset.type } });
    }
    return json({ error: 'Page not found.' }, 404);
  } };
}
