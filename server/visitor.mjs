import { z } from 'zod';
import { Input } from '../shared/schema.mjs';
import { publicUrl, readLimited } from '../shared/url-policy.mjs';
import { evaluate, EvaluationError } from './evaluate.mjs';
import { importSource, sourceText, SourceError } from './source.mjs';

export const VISITOR_BODY_LIMIT = 160 * 1024;
const VisitorRequest = z.object({
  input: Input.pick({ question: true, answerA: true, answerB: true }).strict(),
  sourceUrls: z.array(z.string().max(2000)).max(3).default([]),
  model: z.enum(['gpt-5.4-mini', 'gpt-5.4']).default('gpt-5.4'),
}).strict();

export class VisitorError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function providerFailure(status) {
  if (status === 401) return new VisitorError('OpenAI rejected this API key. Check the key and try again.', 401);
  if (status === 403 || status === 404) return new VisitorError('This key cannot access the selected model. Check its permissions or choose another model.', 403);
  if (status === 429) return new VisitorError('OpenAI reported a usage or rate limit. Check your API billing and limits, then try again.', 429);
  return new VisitorError('OpenAI could not complete this comparison. Try shorter answers or try again later.', 502);
}

// Use one fixed endpoint and explicit headers. No SDK environment defaults,
// automatic retries, response persistence, or credential-bearing diagnostics.
function visitorClient(apiKey, fetchImpl) {
  return { responses: { async parse(parameters, { signal }) {
    const response = await fetchImpl('https://api.openai.com/v1/responses', {
      method: 'POST', redirect: 'error', signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...parameters, store: false }),
    });
    if (!response.ok) { await response.body?.cancel(); throw providerFailure(response.status); }
    let data;
    try { data = JSON.parse(await readLimited(response, 2 * 1024 * 1024)); }
    catch { throw new VisitorError('OpenAI returned an unreadable comparison. Please try again.', 502); }
    if (data.status === 'completed') {
      const text = (data.output || []).flatMap(item => item.type === 'message' ? item.content || [] : [])
        .filter(part => part.type === 'output_text').map(part => part.text).join('');
      if (text) {
        try { data.output_parsed = JSON.parse(text); }
        catch { throw new VisitorError('The model returned an incomplete report. Please try again.', 502); }
      }
    }
    return data;
  } } };
}

export async function compareForVisitor(request, { fetchImpl = fetch, sourceFetch = fetchImpl } = {}) {
  if (request.method !== 'POST') throw new VisitorError('Method not allowed.', 405);
  if (request.headers.get('Origin') !== new URL(request.url).origin) throw new VisitorError('Open Twofold to compare answers.', 403);
  const apiKey = /^Bearer (sk-[A-Za-z0-9_-]{16,512})$/.exec(request.headers.get('Authorization') || '')?.[1];
  if (!apiKey) throw new VisitorError('Enter your own valid OpenAI API key to use this mode.', 401);
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) throw new VisitorError('Send a JSON comparison request.');
  let payload;
  try {
    const body = await readLimited(request, VISITOR_BODY_LIMIT);
    payload = VisitorRequest.parse(JSON.parse(body));
  } catch (error) {
    if (request.signal.aborted) throw request.signal.reason;
    if (error.message === 'This page is too large to import.') throw new VisitorError('The comparison request is too large.', 413);
    throw new VisitorError('Provide a question, two answers, up to three source URLs, and a supported model within the form limits.');
  }
  if (JSON.stringify(payload).includes(apiKey)) throw new VisitorError('Keep the API key in the key field, not in comparison text or source URLs.');
  let urls;
  try { urls = [...new Set(payload.sourceUrls.map(url => publicUrl(url).href))]; }
  catch (error) { throw new VisitorError(error.message); }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(180000)]);
  const research = [];
  try {
    for (const url of urls) {
      signal.throwIfAborted();
      const page = sourceText(await importSource(url, { signal, sourceFetch }));
      research.push({ id: `S${research.length + 1}`, ...page });
    }
    signal.throwIfAborted();
    const result = await evaluate(payload.input, {
      client: visitorClient(apiKey, fetchImpl), model: payload.model, signal,
      suppliedResearch: research,
    });
    if (JSON.stringify(result).includes(apiKey)) throw new VisitorError('The comparison could not be returned safely. Please try again.', 502);
    return result;
  } catch (error) {
    if (request.signal.aborted) throw new VisitorError('Comparison canceled.', 499);
    if (signal.aborted) throw new VisitorError('The comparison timed out. Try shorter answers or try again.', 504);
    if (error instanceof VisitorError) throw error;
    if (error instanceof SourceError) throw new VisitorError(error.message);
    if (error instanceof EvaluationError) throw new VisitorError(error.message, error.status);
    throw new VisitorError('The comparison could not be completed. Please try again.', 502);
  }
}
