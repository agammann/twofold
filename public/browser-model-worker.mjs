// Queue startup messages while the pinned SDK loads. Dynamic import respects
// script-src without permitting remote top-level workers in worker-src.
const pending = [];
self.onmessage = event => pending.push(event);
import('https://esm.run/@mlc-ai/web-llm@0.2.85').then(({ WebWorkerMLCEngineHandler }) => {
  const handler = new WebWorkerMLCEngineHandler();
  self.onmessage = event => handler.onmessage(event);
  for (const event of pending) handler.onmessage(event);
  pending.length = 0;
}).catch(error => { setTimeout(() => { throw error; }, 0); });
