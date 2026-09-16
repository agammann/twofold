import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server/app.mjs';
import { input, report } from './fixtures.mjs';

async function serve(t,options={}) {
  const server=createApp(options).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  t.after(()=>new Promise(r=>{server.close(r);server.closeAllConnections();}));
  const base=`http://127.0.0.1:${server.address().port}`;
  const status=await fetch(`${base}/api/status`).then(r=>r.json());
  const post=(body=input,headers={})=>fetch(`${base}/api/compare`,{method:'POST',headers:{'Content-Type':'application/json','X-Twofold-Token':status.token,...headers},body:typeof body==='string'?body:JSON.stringify(body)});
  return{base,status,post};
}
test('missing credentials produce an actionable setup error',async t=>{const{post,status}=await serve(t);assert.equal(status.configured,false);const r=await post();assert.equal(r.status,503);assert.match((await r.json()).error,/setup/);});
test('origin, host and session token protect local API',async t=>{
  const{base,post}=await serve(t,{client:{}});
  assert.equal((await post(input,{'Origin':'https://evil.example'})).status,403);
  const hostStatus=await new Promise((resolve,reject)=>{const req=http.get(`${base}/api/status`,{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});
  assert.equal(hostStatus,403);
  assert.equal((await post(input,{'X-Twofold-Token':'bad'})).status,403);
  assert.equal((await fetch(`${base}/api/status`,{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
});
test('malformed and oversized input is rejected before evaluation',async t=>{
  let calls=0;const{post}=await serve(t,{client:{},runEvaluation:()=>{calls++;return report;}});
  assert.equal((await post('{')).status,400);assert.equal((await post({...input,question:''})).status,400);
  assert.equal((await post({...input,answerA:'x'.repeat(70000)})).status,413);assert.equal(calls,0);
});
test('valid request returns result without caching',async t=>{
  const{post}=await serve(t,{client:{},runEvaluation:async()=>report});const r=await post();assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal((await r.json()).verdict,'B');
});
test('provider errors do not expose raw secret bearing diagnostics',async t=>{
  const{post}=await serve(t,{client:{},runEvaluation:async()=>{throw Object.assign(new Error('private-secret-should-not-appear'),{status:401});}});
  const r=await post();assert.equal(r.status,401);const body=await r.text();assert.equal(body.includes('private-secret'),false);assert.match(body,/rejected the API key/);
});
test('rate limit bounds cost across repeated requests',async t=>{
  const{post}=await serve(t,{client:{},runEvaluation:async()=>report});for(let i=0;i<10;i++)assert.equal((await post()).status,200);
  const r=await post();assert.equal(r.status,429);assert.equal(r.headers.get('retry-after'),'60');
});
