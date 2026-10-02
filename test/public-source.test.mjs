import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import { createPublicSourceFetch } from '../server/public-source.mjs';
import { importSource } from '../server/source.mjs';
import { readLimited } from '../shared/url-policy.mjs';

function transport(addresses, reply = {}) {
  const connections = [], resolutions = [], responses = [];
  const fetchSource = createPublicSourceFetch({
    lookup(host, options, callback) {
      resolutions.push({ host, options });
      callback(null, typeof addresses === 'function' ? addresses(host) : addresses);
    },
    requestImpl(url, options, onResponse) {
      const request = new EventEmitter();
      request.end = () => options.lookup(url.hostname, { all: true }, (error, approved) => {
        if (error) { queueMicrotask(() => request.emit('error', error)); return; }
        connections.push({ url, options, approved });
        const response = new Readable({ read() {} });
        response.statusCode = reply.status || 200;
        response.headers = { 'content-type': 'text/plain', ...reply.headers };
        responses.push(response);
        onResponse(response);
        if (!response.destroyed) { response.push(reply.text || 'Public source text.'); if (!reply.holdOpen) response.push(null); }
      });
      return request;
    },
  });
  return { fetchSource, connections, resolutions, responses };
}

test('source connection lookup rejects private, mixed, empty, and non-IPv4 DNS answers', async () => {
  for (const addresses of [
    [{ address: '127.0.0.1', family: 4 }],
    [{ address: '10.0.0.5', family: 4 }],
    [{ address: '169.254.169.254', family: 4 }],
    [{ address: '93.184.216.34', family: 4 }, { address: '192.168.1.1', family: 4 }],
    [{ address: '::ffff:127.0.0.1', family: 6 }], [],
  ]) {
    const probe = transport(addresses);
    await assert.rejects(probe.fetchSource('https://public-name.example/'), { code: 'ERR_NON_PUBLIC_SOURCE' });
    assert.equal(probe.connections.length, 0);
    assert.equal(probe.resolutions.length, 1);
    assert.deepEqual(probe.resolutions[0].options, { all: true, family: 4, verbatim: true });
  }
});

test('source connections pin one approved address while preserving hostname and TLS identity', async () => {
  const probe = transport([{ address: '93.184.216.34', family: 4 }, { address: '93.184.216.35', family: 4 }]);
  const response = await probe.fetchSource('https://source.example/path?q=1');
  assert.equal(await response.text(), 'Public source text.');
  assert.equal(probe.resolutions.length, 1);
  const connection = probe.connections[0];
  assert.equal(connection.url.href, 'https://source.example/path?q=1');
  assert.equal(connection.options.servername, 'source.example');
  assert.equal(connection.options.rejectUnauthorized, true);
  assert.equal(connection.options.agent, false);
  assert.equal(connection.options.family, 4);
  assert.equal(connection.options.headers.Authorization, undefined);
  assert.equal(connection.options.headers['Accept-Encoding'], 'identity');
  assert.deepEqual(connection.approved, [{ address: '93.184.216.34', family: 4 }]);
});

test('redirected source hostnames undergo a fresh connection lookup', async () => {
  const probe = transport(host => [{ address: host === 'source.example' ? '93.184.216.34' : '127.0.0.1', family: 4 }],
    { status: 302, headers: { location: 'https://private-alias.example/' } });
  await assert.rejects(importSource('https://source.example/', { sourceFetch: probe.fetchSource }), /could not be imported/);
  assert.deepEqual(probe.resolutions.map(item => item.host), ['source.example', 'private-alias.example']);
  assert.equal(probe.connections.length, 1);
  assert.equal(probe.responses[0].destroyed, true);
});

test('abort during unresolved DNS settles promptly and prevents a later connection', async () => {
  const controller = new AbortController();
  let release, began;
  const started = new Promise(resolve => { began = resolve; });
  const fetchSource = createPublicSourceFetch({ lookup(host, options, callback) { release = callback; began(); } });
  const pending = fetchSource('https://pending.example/', { signal: controller.signal });
  const rejection = assert.rejects(pending, { name: 'AbortError' });
  await started; controller.abort(); await rejection;
  release(null, [{ address: '93.184.216.34', family: 4 }]);
});

test('response cancellation and early size rejection destroy the Node source stream', async () => {
  const canceled = transport([{ address: '93.184.216.34', family: 4 }], { holdOpen: true });
  await (await canceled.fetchSource('https://source.example/')).body.cancel();
  assert.equal(canceled.responses[0].destroyed, true);
  const large = transport([{ address: '93.184.216.34', family: 4 }], { headers: { 'content-length': '3000001' }, holdOpen: true });
  await assert.rejects(readLimited(await large.fetchSource('https://source.example/')), /too large/);
  assert.equal(large.responses[0].destroyed, true);
  const chunked = transport([{ address: '93.184.216.34', family: 4 }], { text: 'a'.repeat(10001), holdOpen: true });
  await assert.rejects(readLimited(await chunked.fetchSource('https://source.example/'), 10000), /too large/);
  assert.equal(chunked.responses[0].destroyed, true);
});

test('unexpected encoding is rejected and bodyless HTTP statuses remain representable', async () => {
  const encoded = transport([{ address: '93.184.216.34', family: 4 }], { headers: { 'content-encoding': 'gzip' } });
  await assert.rejects(encoded.fetchSource('https://source.example/'), /unsupported encoded/);
  assert.equal(encoded.responses[0].destroyed, true);
  const bodyless = transport([{ address: '93.184.216.34', family: 4 }], { status: 304 });
  const response = await bodyless.fetchSource('https://source.example/');
  assert.equal(response.status, 304); assert.equal(response.body, null);
  assert.equal(bodyless.responses[0].destroyed, true);
});
