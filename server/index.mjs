import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createHostedHandler } from './hosted.mjs';
import { localApi } from './local-api.mjs';
import { publicSourceFetch } from './public-source.mjs';
const root=fileURLToPath(new URL('..',import.meta.url)),dev=process.argv.includes('--dev'),port=Number(process.env.PORT||3210);
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('PORT must be an integer from 1024 to 65535.');
const app=express(),handler=createHostedHandler({}, {sourceFetch:publicSourceFetch});app.disable('x-powered-by');
app.use((req,res,next)=>{
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))return res.status(403).json({error:'Twofold accepts localhost requests only.'});
 next();
});
app.use('/api',express.text({type:'*/*',limit:'160kb'}),localApi(handler));
app.use('/api',(error,req,res,next)=>{
 res.status(error.type==='entity.too.large'?413:400).json({error:'The request is too large or could not be read.'});
});
if(dev){const {createServer}=await import('vite');const vite=await createServer({root,server:{middlewareMode:true,hmr:false},appType:'spa'});app.use(vite.middlewares);}else{
 if(!existsSync(path.join(root,'dist/index.html')))throw Error('Build Twofold first with npm run build.');
 const csp=(await handler.fetch(new Request('https://twofold.example/api/status'),{})).headers.get('Content-Security-Policy');
 app.use((req,res,next)=>{res.set('Content-Security-Policy',csp);res.set('X-Content-Type-Options','nosniff');next();});
 app.use('/server',(req,res)=>res.status(404).end());app.use(express.static(path.join(root,'dist'),{dotfiles:'deny'}));app.get('/',(req,res)=>res.sendFile(path.join(root,'dist/index.html')));
}
const server=app.listen(port,'127.0.0.1',()=>console.log(`Twofold browser edition: http://127.0.0.1:${port}`));server.on('error',()=>{console.error('The local server could not start.');process.exitCode=1;});for(const event of ['SIGTERM','SIGINT'])process.on(event,()=>server.close(()=>process.exit(0)));
