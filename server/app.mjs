import express from 'express';
import { randomBytes } from 'node:crypto';
import { Input } from '../shared/schema.mjs';
import { evaluate, EvaluationError } from './evaluate.mjs';

export function createApp({ client, model = 'gpt-5.4-mini', runEvaluation = evaluate } = {}) {
  const app = express();
  const token = randomBytes(32).toString('hex');
  let active = 0, requests = [];
  app.disable('x-powered-by');
  app.use((req,res,next) => {
    res.set('X-Content-Type-Options','nosniff');
    res.set('Referrer-Policy','no-referrer');
    res.set('X-Frame-Options','DENY');
    const host = req.headers.host || '';
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return res.status(403).json({ error: 'Twofold accepts localhost requests only.' });
    if (req.headers.origin && req.headers.origin !== `http://${host}`) return res.status(403).json({ error: 'Cross origin requests are not allowed.' });
    if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({ error: 'Cross site requests are not allowed.' });
    next();
  });
  app.use('/api', (req,res,next) => { res.set('Cache-Control','no-store'); next(); });
  app.get('/api/status', (req,res) => res.json({ configured: Boolean(client), model, token }));
  app.post('/api/compare', express.json({ limit: '64kb' }), async (req,res) => {
    if (req.headers['x-twofold-token'] !== token) return res.status(403).json({ error: 'Refresh the page before comparing.' });
    if (!req.is('application/json')) return res.status(415).json({ error: 'Send a JSON request.' });
    const parsed = Input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter a question (3 to 4,000 characters) and two answers (up to 12,000 characters each).', fields: parsed.error.issues.map(i => i.path.join('.')) });
    if (!client) return res.status(503).json({ error: 'OpenAI is not configured. Run npm run setup in the project folder, then restart Twofold.' });
    const now = Date.now(); requests = requests.filter(t => now-t < 60000);
    if (active >= 2 || requests.length >= 10) { res.set('Retry-After','60'); return res.status(429).json({ error: 'Too many comparisons. Wait a minute and try again.' }); }
    requests.push(now); active++;
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(),180000);
    const cancel = () => { if (!res.writableEnded) controller.abort(); };
    res.on('close',cancel);
    try {
      const result = await runEvaluation(parsed.data, { client, model, signal: controller.signal });
      if (!res.destroyed) res.json(result);
    } catch (error) {
      if (res.destroyed) return;
      let status = 502, message = 'OpenAI could not complete the comparison. Please try again.';
      if (error instanceof EvaluationError) { status = error.status; message = error.message; }
      else if (controller.signal.aborted) { status = 504; message = 'The comparison timed out. Try shorter answers or turn off web checking.'; }
      else if (error.status === 401) { status = 401; message = 'OpenAI rejected the API key. Run npm run setup to replace it, then restart.'; }
      else if (error.status === 429) { status = 429; message = 'OpenAI rate or billing limit reached. Check your API billing and limits, then try again.'; }
      else if (error.status === 403 || error.status === 404) { status = 502; message = 'The configured OpenAI model is unavailable to this project. Check OPENAI_MODEL and project access.'; }
      res.status(status).json({ error: message });
    } finally { clearTimeout(deadline); res.off('close',cancel); active--; }
  });
  app.use('/api', (req,res) => res.status(404).json({ error: 'API route not found.' }));
  app.use((error,req,res,next) => {
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'The request is too large. Shorten your answers.' });
    if (error instanceof SyntaxError) return res.status(400).json({ error: 'The request contains invalid JSON.' });
    res.status(500).json({ error: 'Twofold could not process this request.' });
  });
  return app;
}
