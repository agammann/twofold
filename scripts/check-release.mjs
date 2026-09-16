import { execFileSync } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url));
try{loadEnvFile(path.join(root,'.env.local'));}catch(e){if(e.code!=='ENOENT')throw e;}
const key=process.env.OPENAI_API_KEY;
const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
if(!tracked.length)throw new Error('Stage the release files before running this check.');
const failures=[];
const scan=(relative, data=readFileSync(path.join(root,relative)))=>{
  const text=data.toString('utf8');
  if(key&&data.includes(Buffer.from(key)))failures.push(`${relative}: configured key detected`);
  if(/sk-(?:proj-)?[A-Za-z0-9_-]{25,}/.test(text)||/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))failures.push(`${relative}: possible secret material`);
};
for(const file of tracked){
  if(/(^|\/)\.env(?:\.|$)/.test(file)&&!file.endsWith('.env.example'))failures.push(`${file}: environment file must not be tracked`);
  // Read the exact staged Git blob as well as the current working copy.
  scan(`${file} (staged)`,execFileSync('git',['show',`:${file}`],{cwd:root,maxBuffer:32*1024*1024}));
  scan(file);
}
let bundleFiles=0;
const walk=(dir)=>{for(const e of readdirSync(path.join(root,dir),{withFileTypes:true})){const p=`${dir}/${e.name}`;if(e.isDirectory())walk(p);else{scan(p);bundleFiles++;}}};
if(existsSync(path.join(root,'dist')))walk('dist');else failures.push('Build output is missing.');
if(process.argv.includes('--http')){
  const base=`http://127.0.0.1:${process.env.PORT||3210}`;
  for(const p of ['/.env.local','/.env','/.git/config','/server/index.mjs','/server/index.js','/.openai/hosting.json','/db/schema.ts','/scripts/setup.mjs','/@fs/etc/passwd']){
    const r=await fetch(`${base}${p}`);const body=await r.text();
    if(r.status!==404)failures.push(`${p}: expected 404, received ${r.status}`);
    if(key&&body.includes(key))failures.push(`${p}: configured key exposed`);
  }
  const r=await fetch(`${base}/api/status`);const body=await r.text();
  if(key&&body.includes(key))failures.push('Status endpoint exposes the configured key.');
  const home=await fetch(base);if(!home.headers.get('content-security-policy'))failures.push('Production CSP missing.');
}
if(failures.length){console.error(JSON.stringify({passed:false,failures},null,2));process.exit(1);}
console.log(JSON.stringify({passed:true,trackedFiles:tracked.length,bundleFiles,configuredKeyChecked:Boolean(key),httpChecked:process.argv.includes('--http')}));
