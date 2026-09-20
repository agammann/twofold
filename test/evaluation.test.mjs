import test from 'node:test';
import assert from 'node:assert/strict';
import { collectSources, safeUrl, validateReport, evaluate } from '../server/evaluate.mjs';
import { Input, quoteOptions, reportSchemaFor } from '../shared/schema.mjs';
import { markdownReport } from '../shared/export.mjs';
import { input, report } from './fixtures.mjs';
import { reportMessages } from '../shared/labels.mjs';

test('bounds inputs and rejects extra fields',()=>{
  assert.equal(Input.safeParse({...input,answerA:' '.repeat(10)}).success,false);
  assert.equal(Input.safeParse({...input,question:'a'.repeat(4001)}).success,false);
  assert.equal(Input.safeParse({...input,answerB:'a'.repeat(12001)}).success,false);
  assert.equal(Input.safeParse({...input,apiKey:'unexpected'}).success,false);
});
test('sources are restricted to safe URLs returned by the provider',()=>{
  assert.equal(safeUrl('javascript:alert(1)'),null);assert.equal(safeUrl('https://user:pass@example.com'),null);
  const sources=collectSources({output:[{type:'web_search_call',action:{sources:[{url:'https://example.com/a',title:'A'},{url:'javascript:alert(1)'}]}},{type:'message',content:[{annotations:[{type:'url_citation',url:'https://example.com/a',title:'duplicate'},{type:'url_citation',url:'https://example.org/b',title:'B'}]}]}]});
  assert.equal(sources.length,2);assert.deepEqual(sources.map(s=>s.id),['S1','S2']);
});
test('tracking variants share one citation without merging distinct query results',()=>{
  const urls=['https://example.com/page?id=1','https://example.com/page?id=1&utm_source=openai','https://example.com/page?id=2'];
  const sources=collectSources({output:[{type:'web_search_call',action:{sources:urls.map(url=>({url}))}}]});
  assert.deepEqual(sources.map(s=>s.url),[urls[0],urls[2]]);
  assert.deepEqual(sources.map(s=>s.id),['S1','S2']);
  const trackedFirst=collectSources({output:[{type:'message',content:[{annotations:urls.slice(0,2).reverse().map(url=>({type:'url_citation',url}))}]}]});
  assert.equal(trackedFirst.length,1);assert.equal(trackedFirst[0].url,urls[1]);
});

test('rejects invented citations and missing evidence references',()=>{
  const forged=structuredClone(report);forged.claims[0].sourceIds=['S99'];assert.throws(()=>validateReport(forged,input,[]),/unknown source/);
  forged.claims[0].sourceIds=[];forged.claims[0].basis='retrieved evidence';assert.throws(()=>validateReport(forged,input,[]),/missing its citation/);
});
test('checks exact quotes and distinguishes inferences',()=>{
  assert.equal(validateReport(report,input,[]).verdict,'B');
  const forged=structuredClone(report);forged.answerA.reasoning[0].quote='a fabricated statement';assert.throws(()=>validateReport(forged,input,[]),/did not match/);
  forged.answerA.reasoning[0].basis='inferred';assert.throws(()=>validateReport(forged,input,[]),/inferred/);
  forged.answerA.reasoning[0].quote='';assert.equal(validateReport(forged,input,[]).verdict,'B');
});
test('generation schema constrains quotes to exact input excerpts',()=>{
  const original='Paragraph one.\n\n'+('x'.repeat(1100));
  const options=quoteOptions(original);assert.ok(options.every(q=>original.includes(q)&&q.length<=480));
  const schema=reportSchemaFor(input);const valid=structuredClone(report);
  valid.answerA.reasoning[0].quote=input.answerA;valid.answerB.reasoning[0].quote=input.answerB;
  assert.equal(schema.safeParse(valid).success,true);
  valid.answerA.reasoning[0].quote='invented';assert.equal(schema.safeParse(valid).success,false);
});
test('claim attribution must match the quoted answer',()=>{
  const forged=structuredClone(report);forged.claims[0].answer='A';
  assert.throws(()=>validateReport(forged,input,[]),/attributed answer/);
});

test('reports can honestly omit reasoning, differences, claims, and caveats',()=>{
  const minimal=structuredClone(report);
  minimal.answerA.reasoning=[];minimal.answerB.reasoning=[];
  minimal.differences=[];minimal.claims=[];minimal.limitations=[];
  assert.equal(reportSchemaFor(input).safeParse(minimal).success,true);
  assert.doesNotThrow(()=>validateReport(minimal,input,[]));
  const md=markdownReport(input,minimal);
  for(const message of Object.values(reportMessages))assert.ok(md.includes(message));
});

test('identical answers cannot have a preferred author or invented differences',()=>{
  const same={...input,answerA:'4.',answerB:'4.'};
  const r=structuredClone(report);r.answerA.reasoning=[];r.answerB.reasoning=[];r.claims=[];r.differences=[];
  for(const verdict of ['both','neither','depends','insufficient']){
    r.verdict=verdict;assert.equal(reportSchemaFor(same).safeParse(r).success,true);
    assert.doesNotThrow(()=>validateReport(r,same,[]));
  }
  for(const verdict of ['A','B']){
    r.verdict=verdict;assert.equal(reportSchemaFor(same).safeParse(r).success,false);
    assert.throws(()=>validateReport(r,same,[]),/Identical answers/);
  }
  r.verdict='both';r.differences=['A explains it better.'];
  assert.equal(reportSchemaFor(same).safeParse(r).success,false);
  assert.throws(()=>validateReport(r,same,[]),/Identical answers/);
});
test('calls live evaluator protocol without author labels and disables storage',async()=>{
  const calls=[];
  const client={responses:{parse:async(request)=>{calls.push(request);return{status:'completed',output_parsed:report,output:[],usage:{input_tokens:20,output_tokens:30}};}}};
  const result=await evaluate({...input,nameA:'Famous Author',nameB:'Novice'}, {client,model:'test'});
  assert.equal(calls.length,1);assert.equal(calls[0].store,false);assert.equal(calls[0].input.includes('Famous Author'),false);
  assert.equal(result.meta.usage.outputTokens,30);assert.equal(result.meta.searched,false);
});
test('research precedes evaluation and passes a source allowlist',async()=>{
  const calls=[];const supported=structuredClone(report);supported.claims[0].basis='retrieved evidence';supported.claims[0].sourceIds=['S1'];
  const client={responses:{create:async(r)=>{calls.push(r);return{status:'completed',output_text:'Source supports the result.',output:[{type:'web_search_call',action:{sources:[{url:'https://example.com',title:'Example'}]}}]};},parse:async(r)=>{calls.push(r);assert.match(r.input,/S1/);return{status:'completed',output_parsed:supported,output:[]};}}};
  const result=await evaluate({...input,web:true},{client,model:'test'});
  assert.equal(calls.length,2);assert.equal(calls[0].tool_choice,'required');assert.equal(calls[0].store,false);assert.equal(result.meta.searched,true);
});
test('refused and incomplete provider responses do not become reports',async()=>{
  for(const response of [{status:'incomplete',output:[]},{status:'completed',output:[{type:'message',content:[{type:'refusal'}]}]}]){
    await assert.rejects(evaluate(input,{client:{responses:{parse:async()=>response}},model:'test'}));
  }
});
test('export contains inputs, sources, and limitations but escapes injected Markdown',()=>{
  const md=markdownReport({...input,answerA:'<script>alert(1)</script> ![x](https://example.com/track)'},report);
  assert.match(md,/&lt;script/);assert.equal(md.includes('![x]'),false);assert.match(md,/## Limitations/);assert.match(md,/private thought processes/);
});
