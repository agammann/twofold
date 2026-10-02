import test from 'node:test';import assert from 'node:assert/strict';
import { createHostedHandler } from '../server/hosted.mjs';
test('retired hosted inference cannot use an old operator key or durable database',async()=>{
 const handler=createHostedHandler(),env=new Proxy({},{get(){throw Error('Unexpected environment access');}});
 const r=await handler.fetch(new Request('https://twofold.example/api/compare',{method:'POST',body:'{}'}),env);assert.equal(r.status,410);
 const status=await handler.fetch(new Request('https://twofold.example/api/status'),env);assert.deepEqual(await status.json(),{configured:true,hosted:true,browser:true,paidInference:false,visitorHosted:true});
});
test('static allowlist protects server files and allows browser model assets through CSP',async()=>{
 const handler=createHostedHandler({'/':{type:'text/html',data:btoa('<h1>Twofold</h1>')}});
 for(const path of ['/.env.local','/server/index.js','/.openai/hosting.json','/db/schema.ts'])assert.equal((await handler.fetch(new Request('https://twofold.example'+path),{})).status,404);
 const home=await handler.fetch(new Request('https://twofold.example/'),{});assert.match(await home.text(),/Twofold/);
 const csp=home.headers.get('Content-Security-Policy');assert.match(csp,/https:\/\/esm.run/);assert.match(csp,/wasm-unsafe-eval/);assert.match(csp,/frame-ancestors 'none'/);
 const head=await handler.fetch(new Request('https://twofold.example/',{method:'HEAD'}),{});assert.equal(await head.text(),'');
});
test('public source imports reject invalid URLs and cross-origin requests',async()=>{
 const handler=createHostedHandler();
 for(const url of ['http://127.0.0.1','https://localhost','https://user:secret@example.com','file:///etc/passwd']){const r=await handler.fetch(new Request('https://twofold.example/api/source',{method:'POST',headers:{Origin:'https://twofold.example'},body:JSON.stringify({url})}),{});assert.equal(r.status,400);}
 const r=await handler.fetch(new Request('https://twofold.example/api/source',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'}),{});assert.equal(r.status,403);
});

test('source request limits stop reading and cancel oversized streams before any import',async()=>{
 let calls=0;const handler=createHostedHandler({}, {fetchImpl:async()=>{calls++;throw Error('Must not import.');}});
 for(const advertised of [false,true]){
  let bytes=0,canceled=false;
  const body=new ReadableStream({pull(controller){bytes+=4096;controller.enqueue(new Uint8Array(4096));},cancel(){canceled=true;}},{highWaterMark:0});
  const headers={Origin:'https://twofold.example',...(advertised?{'Content-Length':'1310720'}:{})};
  const response=await handler.fetch(new Request('https://twofold.example/api/source',{method:'POST',headers,body,duplex:'half'}),{});
  assert.equal(response.status,413);assert.equal(canceled,true);
  assert.equal(bytes,advertised?0:12288);
 }
 assert.equal(calls,0);
});
