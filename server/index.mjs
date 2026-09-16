import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import OpenAI from 'openai';
import { createApp } from './app.mjs';

const root = fileURLToPath(new URL('..',import.meta.url));
try { loadEnvFile(path.join(root,'.env.local')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
const dev = process.argv.includes('--dev');
const port = Number(process.env.PORT || 3210);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT must be an integer from 1024 to 65535.');
const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: 'https://api.openai.com/v1', timeout: 175000, maxRetries: 0 }) : null;
const app = createApp({ client, model });
if (dev) {
  const { createServer } = await import('vite');
  const vite = await createServer({ root, server: { middlewareMode: true, hmr: false }, appType: 'spa' });
  app.use(vite.middlewares);
} else {
  if (!existsSync(path.join(root,'dist/index.html'))) throw new Error('Build Twofold first with npm run build.');
  app.use((req,res,next) => { res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"); next(); });
  app.use('/server', (req,res) => res.status(404).end());
  app.use(express.static(path.join(root,'dist'),{ dotfiles:'deny' }));
  app.get('/', (req,res) => res.sendFile(path.join(root,'dist/index.html')));
}
const server = app.listen(port,'127.0.0.1',() => {
  console.log(`Twofold is ready at http://127.0.0.1:${port}`);
  console.log(`OpenAI: ${client ? 'configured' : 'run npm run setup'} | Model: ${model}`);
});
server.on('error',e => { console.error(e.code === 'EADDRINUSE' ? `Port ${port} is in use. Set a different PORT in .env.local.` : 'The local server could not start.'); process.exitCode=1; });
for (const event of ['SIGTERM','SIGINT']) process.on(event,() => server.close(() => process.exit(0)));
