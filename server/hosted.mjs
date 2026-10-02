import { importSource, SourceError } from './source.mjs';
import { compareForVisitor, VisitorError } from './visitor.mjs';
import { readLimited } from '../shared/url-policy.mjs';
const headers={ 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cache-Control':'no-store',
 'Content-Security-Policy':"default-src 'self'; script-src 'self' https://esm.run https://cdn.jsdelivr.net 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://esm.run https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co https://raw.githubusercontent.com; worker-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
const json=(data,status=200)=>Response.json(data,{status,headers});
export function createHostedHandler(assets={},dependencies={}){return {async fetch(request,env){
 const url=new URL(request.url);
 if(request.method==='GET'&&url.pathname==='/api/status')return json({configured:true,hosted:true,browser:true,paidInference:false,visitorHosted:true});
 if(url.pathname==='/api/compare')return json({error:'Comparison runs in your browser. Refresh Twofold to use the current version.'},410);
 if(url.pathname==='/api/compare/visitor'){
  try{return json(await compareForVisitor(request,dependencies));}
  catch(error){return json({error:error instanceof VisitorError?error.message:'The comparison could not be completed. Please try again.'},error instanceof VisitorError?error.status:502);}
 }
 if(url.pathname==='/api/source'){
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('Origin')!==url.origin)return json({error:'Open Twofold to import a source.'},403);
  try{
   let body;
   try{body=await readLimited(request,10000);}
   catch(error){return json({error:error.message==='This page is too large to import.'?'The source import request is too large.':'The source import request could not be read.'},error.message==='This page is too large to import.'?413:400);}
   const page=await importSource(JSON.parse(body).url,{...dependencies,signal:request.signal});
   return json({url:page.url,html:page.html});
  }catch(error){return json({error:error instanceof SourceError?error.message:'This source could not be imported. Check the URL and try again.'},400);}
 }
 if(request.method==='GET'||request.method==='HEAD'){const asset=assets[url.pathname];if(asset)return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0)),{headers:{...headers,'Content-Type':asset.type}});}
 return json({error:'Page not found.'},404);
}};}
