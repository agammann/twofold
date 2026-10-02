export function localApi(handler) {
  return async (req, res) => {
    const controller = new AbortController();
    const disconnect = () => { if (!res.writableEnded) controller.abort(); };
    req.once('aborted', disconnect); res.once('close', disconnect);
    if (req.aborted || res.destroyed) controller.abort();
    try {
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) if (typeof value === 'string') headers.set(name, value);
      const request = new Request(`http://${req.headers.host}${req.originalUrl}`, {
        method: req.method, headers, signal: controller.signal,
        ...(req.method === 'POST' ? { body: req.body || '' } : {}),
      });
      const response = await handler.fetch(request, {});
      const body = Buffer.from(await response.arrayBuffer());
      if (!res.destroyed) {
        res.status(response.status);
        for (const [name, value] of response.headers) res.set(name, value);
        res.send(body);
      }
    } catch {
      if (!res.destroyed) res.status(400).json({ error: 'The request could not be processed.' });
    } finally {
      req.removeListener('aborted', disconnect); res.removeListener('close', disconnect);
    }
  };
}
