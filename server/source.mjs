import { parseHTML } from 'linkedom/worker';
import { publicUrl, readLimited } from '../shared/url-policy.mjs';

export class SourceError extends Error {}

export async function importSource(url, { signal, fetchImpl = fetch, sourceFetch = fetchImpl } = {}) {
  let target;
  try { target = publicUrl(url); } catch (error) { throw new SourceError(error.message); }
  const deadline = AbortSignal.timeout(15000);
  const requestSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  try {
    for (let i = 0; i < 5; i++) {
      requestSignal.throwIfAborted();
      const response = await sourceFetch(target.href, {
        redirect: 'manual', headers: { Accept: 'text/html,text/plain' }, signal: requestSignal,
      });
      if (response.status >= 300 && response.status < 400 && response.headers.get('location')) {
        await response.body?.cancel();
        try { target = publicUrl(new URL(response.headers.get('location'), target).href); }
        catch (error) { throw new SourceError(error.message); }
        continue;
      }
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !/^text\/(html|plain)(?:;|$)/i.test(contentType)) {
        await response.body?.cancel();
        throw new SourceError('This page cannot be imported. Choose another public text page.');
      }
      let html;
      try { html = await readLimited(response); }
      catch (error) {
        if (requestSignal.aborted) throw error;
        throw new SourceError('This page is too large or could not be read. Choose another public text page.');
      }
      return { url: target.href, html, contentType };
    }
    throw new SourceError('Too many redirects. Choose a direct public page URL.');
  } catch (error) {
    if (signal?.aborted) throw signal.reason;
    if (error instanceof SourceError) throw error;
    throw new SourceError('This page could not be imported. Check the URL or choose another public text page.');
  }
}

export function sourceText(page) {
  let text = page.html, title = new URL(page.url).hostname;
  if (/^text\/html(?:;|$)/i.test(page.contentType)) {
    // Parse full documents directly: a doctype is not valid body.innerHTML.
    const { document } = parseHTML(page.html);
    title = document.querySelector('title')?.textContent.trim() || title;
    document.querySelectorAll('head,title,script,style,nav,footer,header,noscript,template').forEach(element => element.remove());
    // Fragments can have several top-level elements or loose text, so retain
    // every sibling while excluding doctype and comment nodes.
    text = [...document.childNodes].map(node => node.nodeType === 1 ? node.innerText : node.nodeType === 3 ? node.textContent : '').join(' ');
  }
  text = text.replace(/\s+/g, ' ').trim();
  if (!text) throw new SourceError('This source has no readable text.');
  if (text.length > 12000) throw new SourceError('This source is too long for a comparison. Choose a shorter page.');
  return { url: page.url, title: title.slice(0, 240), text };
}
