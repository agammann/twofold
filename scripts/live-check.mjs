import { loadEnvFile } from 'node:process';
import OpenAI from 'openai';
import { evaluate } from '../server/evaluate.mjs';
import assert from 'node:assert/strict';

try{loadEnvFile(new URL('../.env.local',import.meta.url));}catch(e){if(e.code!=='ENOENT')throw e;}
if(!process.env.OPENAI_API_KEY)throw new Error('Configure your API key with npm run setup first.');
const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,baseURL:'https://api.openai.com/v1',maxRetries:0});
const model=process.env.OPENAI_MODEL||'gpt-5.4-mini';
const input={question:'Is a 20% increase followed by a 20% decrease a wash?',answerA:'Yes. The percentages cancel each other out, so you end up where you started.',answerB:'No. Starting at 100, a 20% increase gives 120. A 20% decrease then gives 96, a 4% loss.',web:false};
const result=await evaluate(input,{client,model,signal:AbortSignal.timeout(180000)});
assert.equal(result.verdict,'B');assert.equal(result.sources.length,0);
console.log(JSON.stringify({case:'arithmetic',passed:true,verdict:result.verdict,model:result.meta.model,usage:result.meta.usage}));
if(process.argv.includes('--web')){
  const r=await evaluate({question:'In Python 3, is a built in list mutable or immutable?',answerA:'A list is immutable. You cannot change its elements after creation.',answerB:'A list is mutable. You can replace elements and append new items.',web:true},{client,model,signal:AbortSignal.timeout(180000)});
  assert.equal(r.verdict,'B');assert.equal(r.meta.searched,true);assert.ok(r.sources.length>0);assert.ok(r.claims.some(c=>c.sourceIds.length>0));
  console.log(JSON.stringify({case:'web evidence',passed:true,verdict:r.verdict,sources:r.sources.length,model:r.meta.model,usage:r.meta.usage}));
}
