import { lookup as dnsLookup } from 'node:dns';
import { request as httpsRequest } from 'node:https';
import { Readable } from 'node:stream';
import { isPublicIP, publicUrl } from '../shared/url-policy.mjs';

export function createPublicSourceFetch({ lookup = dnsLookup, requestImpl = httpsRequest } = {}) {
  return async (input, { signal } = {}) => {
    const url = publicUrl(input);
    signal?.throwIfAborted();
    return new Promise((resolve, reject) => {
      const request = requestImpl(url, {
        method: 'GET', agent: false, family: 4, autoSelectFamily: false,
        servername: url.hostname, rejectUnauthorized: true, signal,
        headers: { Accept: 'text/html,text/plain', 'Accept-Encoding': 'identity' },
        // This is the connection's own lookup, not a precheck followed by a
        // second resolution. Each redirect creates a new guarded connection.
        lookup(hostname, options, callback) {
          lookup(hostname, { all: true, family: 4, verbatim: true }, (error, addresses) => {
            if (signal?.aborted) return callback(signal.reason);
            if (error) return callback(error);
            if (!addresses?.length || addresses.some(item => item.family !== 4 || !isPublicIP(item.address))) {
              return callback(Object.assign(new Error('The source hostname must resolve only to public IPv4 addresses.'), { code: 'ERR_NON_PUBLIC_SOURCE' }));
            }
            const pinned = { address: addresses[0].address, family: 4 };
            if (options?.all) callback(null, [pinned]);
            else callback(null, pinned.address, pinned.family);
          });
        },
      }, response => {
        try {
          const encoding = response.headers['content-encoding'];
          if (encoding && encoding.toLowerCase() !== 'identity') {
            response.destroy();
            reject(new Error('The source returned unsupported encoded content.'));
            return;
          }
          const headers = new Headers();
          for (const [name, value] of Object.entries(response.headers)) {
            if (Array.isArray(value)) for (const item of value) headers.append(name, item);
            else if (value !== undefined) headers.set(name, value);
          }
          const status = response.statusCode;
          if ([204, 205, 304].includes(status)) {
            response.destroy();
            resolve(new Response(null, { status, headers }));
          } else {
            resolve(new Response(Readable.toWeb(response, { strategy: { highWaterMark: 0 } }), { status, headers }));
          }
        } catch (error) {
          response.destroy();
          reject(error);
        }
      });
      request.once('error', reject);
      request.end();
    });
  };
}

export const publicSourceFetch = createPublicSourceFetch();
