import { publicUrl, readLimited } from '../shared/url-policy.mjs';
const headers={ 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cache-Control':'no-store',
 'Content-Security-Policy':"default-src 'self'; script-src 'self' https://esm.run https://cdn.jsdelivr.net 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://esm.run https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co https://raw.githubusercontent.com; worker-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
const json=(data,status=200)=>Response.json(data,{status,headers});
export function createHostedHandler(assets={}){return {async fetch(request,env){
 const url=new URL(request.url);
 if(request.method==='GET'&&url.pathname==='/api/status')return json({configured:true,hosted:true,browser:true,paidInference:false});
 if(url.pathname==='/api/compare')return json({error:'Comparison runs in your browser. Refresh Twofold to use the current version.'},410);
 if(url.pathname==='/api/source'){
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('Origin')!==url.origin)return json({error:'Open Twofold to import a source.'},403);
  try{
   const body=await request.text();if(body.length>10000)throw Error('Request too large.');let target=publicUrl(JSON.parse(body).url);
   for(let i=0;i<5;i++){
    const r=await fetch(target.href,{redirect:'manual',headers:{Accept:'text/html,text/plain'},signal:AbortSignal.timeout(15000)});
    if(r.status>=300&&r.status<400&&r.headers.get('location')){target=publicUrl(new URL(r.headers.get('location'),target).href);continue;}
    if(!r.ok||!/text\/(html|plain)/i.test(r.headers.get('Content-Type')||''))throw Error('This page cannot be imported. Choose another public text page.');
    return json({url:target.href,html:await readLimited(r)});
   }throw Error('Too many redirects.');
  }catch(e){return json({error:e.message},400);}
 }
 if(request.method==='GET'||request.method==='HEAD'){const asset=assets[url.pathname];if(asset)return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{headers:{...headers,'Content-Type':asset.type}});}
 return json({error:'Page not found.'},404);
}};}
