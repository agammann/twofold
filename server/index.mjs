import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createHostedHandler } from './hosted.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),dev=process.argv.includes('--dev'),port=Number(process.env.PORT||3210);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('PORT must be an integer from 1024 to 65535.');
const app=express(),handler=createHostedHandler();app.disable('x-powered-by');
app.use('/api',express.text({type:'*/*',limit:'10kb'}),async(req,res)=>{
 const origin=`http://127.0.0.1:${port}`,headers=new Headers();for(const [name,value] of Object.entries(req.headers))if(typeof value==='string')headers.set(name,value);
 try{const request=new Request(origin+req.originalUrl,{method:req.method,headers,...(req.method==='POST'?{body:req.body||''}:{})});const response=await handler.fetch(request,{});res.status(response.status);for(const [name,value]of response.headers)res.set(name,value);res.send(Buffer.from(await response.arrayBuffer()));}catch{res.status(400).json({error:'The request could not be processed.'});}
});
if(dev){const {createServer}=await import('vite');const vite=await createServer({root,server:{middlewareMode:true,hmr:false},appType:'spa'});app.use(vite.middlewares);}else{
 if(!existsSync(path.join(root,'dist/index.html')))throw Error('Build Twofold first with npm run build.');
 const csp=(await handler.fetch(new Request('https://twofold.example/api/status'),{})).headers.get('Content-Security-Policy');
 app.use((req,res,next)=>{res.set('Content-Security-Policy',csp);res.set('X-Content-Type-Options','nosniff');next();});
 app.use('/server',(req,res)=>res.status(404).end());app.use(express.static(path.join(root,'dist'),{dotfiles:'deny'}));app.get('/',(req,res)=>res.sendFile(path.join(root,'dist/index.html')));
}
const server=app.listen(port,'127.0.0.1',()=>console.log(`Twofold browser edition: http://127.0.0.1:${port}`));server.on('error',()=>{console.error('The local server could not start.');process.exitCode=1;});for(const event of ['SIGTERM','SIGINT'])process.on(event,()=>server.close(()=>process.exit(0)));
