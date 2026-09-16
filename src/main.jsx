import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { verdictLabels, reportMessages } from '../shared/labels.mjs';
import { markdownReport } from '../shared/export.mjs';
import './style.css';
import './theme.css';

const example = {
  question: 'Is a 20% increase followed by a 20% decrease a wash?',
  answerA: 'Yes. The percentages cancel each other out, so you end up where you started.',
  answerB: 'No. Starting at 100, a 20% increase gives 120. A 20% decrease then gives 96, a 4% loss.',
  nameA: '', nameB: '', web: false,
};
const empty = { question:'',answerA:'',answerB:'',nameA:'',nameB:'',web:false };

function Icon({ type, ...props }) {
  const paths = { arrow: <><path d="M4 12h15m-5-5 5 5-5 5"/></>, swap: <><path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/></>, file: <><path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6"/></>, export: <><path d="M12 3v12m-4-4 4 4 4-4M5 15v6h14v-6"/></>, close: <path d="m6 6 12 12M18 6 6 18"/>, logo: <><rect x="3" y="3" width="14" height="11" rx="1.5"/><rect x="7" y="10" width="14" height="11" rx="1.5"/></> };
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[type]}</svg>;
}

function AnswerEditor({ id, data, update, disabled }) {
  return <section className={`answer-editor answer-${id.toLowerCase()}`} aria-labelledby={`title-${id}`}>
    <h2 id={`title-${id}`}><span className={`letter letter-${id}`}>{id}</span>Answer {id}</h2>
    <div className="editor-fields">
      <label htmlFor={`name-${id}`}>Author or bot <span>(optional)</span></label>
      <input id={`name-${id}`} value={data[`name${id}`]} maxLength={80} onChange={e=>update(`name${id}`,e.target.value)} placeholder={id==='A'?'e.g. Alex or ChatGPT':'e.g. Blair or Claude'} disabled={disabled}/>
      <label htmlFor={`answer-${id}`}>Your answer</label>
      <textarea id={`answer-${id}`} value={data[`answer${id}`]} maxLength={12000} required onChange={e=>update(`answer${id}`,e.target.value)} placeholder="Paste the full answer, including any explanation…" disabled={disabled}/>
      <span className="count">{data[`answer${id}`].length.toLocaleString()} / 12,000</span>
    </div>
  </section>;
}

function Reasoning({ id, answer, name }) {
  return <section className="reasoning">
    <h3><span className={`letter letter-${id}`}>{id}</span>How {id} gets there {name && <span className="author">{name}</span>}</h3>
    <p className="conclusion">{answer.conclusion}</p>
    {answer.reasoning.length ? <ol>{answer.reasoning.map((step,i)=><li key={i}><span className={`step-num letter-${id}`}>{i+1}</span><div><p>{step.explanation}</p><span className="basis">{step.basis==='stated'?'Stated in the answer':'Inferred assumption'}</span>{step.quote && <blockquote>{step.quote}</blockquote>}</div></li>)}</ol> : <p className="muted">{reportMessages.reasoning}</p>}
    {answer.strengths.length>0 && <div className="qualities"><h4>What holds up</h4><ul>{answer.strengths.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
    {answer.weaknesses.length>0 && <div className="qualities"><h4>Where it falls short</h4><ul>{answer.weaknesses.map((s,i)=><li key={i}>{s}</li>)}</ul></div>}
  </section>;
}

function Results({ result, input, resultRef }) {
  const [section,setSection]=useState('verdict');
  function download() {
    const blob = new Blob([markdownReport(input,result)],{type:'text/markdown;charset=utf-8'});
    const url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=`twofold-${result.meta.createdAt.slice(0,10)}.md`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const sources=new Map(result.sources.map(s=>[s.id,s]));
  return <section className="results" ref={resultRef} tabIndex={-1} aria-label="Comparison results">
    <div className="section-heading"><h2>The comparison</h2><button className="quiet" onClick={download}><Icon type="export"/>Export report</button></div>
    <nav className="report-nav" aria-label="Report sections">{['verdict','reasoning','claims','sources'].map(id=><a key={id} className={section===id?'selected':''} href={`#report-${id}`} onClick={()=>setSection(id)}>{id[0].toUpperCase()+id.slice(1)}</a>)}</nav>
    <div id="report-verdict" className={`verdict verdict-${result.verdict}`}>
      <h3>{verdictLabels[result.verdict]}</h3><p>{result.rationale}</p>
      <p className="verdict-meta">{result.confidence[0].toUpperCase()+result.confidence.slice(1)} confidence · {result.meta.searched ? `${result.sources.length} web sources retrieved`:'No web sources checked'}</p>
      <details><summary>Why this confidence?</summary><p>{result.confidenceReason}</p><p>Confidence is the evaluator’s assessment, not a measured probability.</p></details>
    </div>
    <div id="report-reasoning" className="reasoning-grid"><Reasoning id="A" answer={result.answerA} name={input.nameA}/><Reasoning id="B" answer={result.answerB} name={input.nameB}/></div>
    <div className="differences"><h3>The decisive differences</h3>{result.differences.length ? <ul>{result.differences.map((d,i)=><li key={i}>{d}</li>)}</ul> : <p className="muted">{reportMessages.differences}</p>}{result.agreements.length>0 && <details><summary>Where they agree</summary><ul>{result.agreements.map((d,i)=><li key={i}>{d}</li>)}</ul></details>}</div>
    <section className="claims" id="report-claims"><h3>Check the claims</h3><p className="muted">Evidence and calculation are separated from the model’s assessment.</p>
      {result.claims.length === 0 && <p>{reportMessages.claims}</p>}
      {result.claims.map((claim,i)=><article className="claim" key={i}><div className="claim-label"><span className={`assessment ${claim.assessment}`}>{claim.assessment}</span><span>Answer {claim.answer==='both'?'A + B':claim.answer}</span></div><div><h4>{claim.claim}</h4><p>{claim.explanation}</p><details className="claim-quote"><summary>See the original wording</summary><blockquote>{claim.quote}</blockquote></details><div className="claim-evidence"><span>{claim.basis}</span>{claim.sourceIds.map(id=>sources.has(id)&&<a key={id} href={sources.get(id).url} target="_blank" rel="noopener noreferrer">[{id}] {sources.get(id).title}</a>)}</div></div></article>)}
    </section>
    <section className="better-answer"><h3>A better answer</h3><p>{result.betterAnswer}</p></section>
    <section className="limits"><h3>What remains uncertain</h3>{result.limitations.length ? <ul>{result.limitations.map((l,i)=><li key={i}>{l}</li>)}</ul> : <p>{reportMessages.limitations}</p>}</section>
    <section id="report-sources" className="source-section"><h3>Sources</h3>{result.sources.length>0 ? <><p className="muted">Retrieval does not mean every source supports the verdict. Claim references above show which sources the evaluator used.</p><ol className="sources">{result.sources.map(s=><li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">[{s.id}] {s.title}</a><span>{new URL(s.url).hostname}</span></li>)}</ol></> : <p className="muted">{result.meta.webRequested?'Web checking did not return usable sources. The evaluation is not externally verified.':'No web sources were checked. Enable “Check web sources” before comparing to look for external evidence.'}</p>}</section>
    <p className="run-meta">{result.meta.model} · {new Date(result.meta.createdAt).toLocaleString()} · {result.meta.usage.inputTokens.toLocaleString()} input / {result.meta.usage.outputTokens.toLocaleString()} output tokens</p>
  </section>;
}

function App() {
  const [data,setData]=useState(empty), [status,setStatus]=useState(null), [error,setError]=useState('');
  const [busy,setBusy]=useState(false), [result,setResult]=useState(null), [resultInput,setResultInput]=useState(null), [elapsed,setElapsed]=useState(0);
  const [notice,setNotice]=useState('');
  const controller=useRef(null), resultRef=useRef(null), howRef=useRef(null);
  useEffect(()=>{
    const context=document.modelContext; if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const tool={name:'prepare_comparison',title:'Prepare a comparison',description:'Fill the visible question and two answers. Does not submit or call OpenAI. The visitor can review and press Compare answers.',
      inputSchema:{type:'object',properties:{question:{type:'string',minLength:3,maxLength:4000},answerA:{type:'string',minLength:1,maxLength:12000},answerB:{type:'string',minLength:1,maxLength:12000}},required:['question','answerA','answerB'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:true},execute(value){
        if(controller.current)throw Error('Wait until the current comparison finishes.');
        if(!value||Object.keys(value).some(k=>!['question','answerA','answerB'].includes(k))||['question','answerA','answerB'].some(k=>typeof value[k]!=='string'||value[k].trim().length<(k==='question'?3:1)||value[k].length>(k==='question'?4000:12000)))throw Error('Provide a question and two answers within the form limits.');
        flushSync(()=>{setData({...empty,...value});setResult(null);setError('');setNotice('Answers prepared. Review them before comparing.');});
        return {prepared:true,submitted:false};
      }};
    try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
    return()=>lifecycle.abort();
  },[]);
  useEffect(()=>{fetch('/api/status').then(r=>{if(!r.ok) throw Error(); return r.json();}).then(setStatus).catch(()=>setError('Cannot reach Twofold. Please refresh this page and try again.')); return ()=>controller.current?.abort();},[]);
  useEffect(()=>{if(!busy)return;const timer=setInterval(()=>setElapsed(s=>s+1),1000);return()=>clearInterval(timer);},[busy]);
  const update=(key,value)=>{setData(d=>({...d,[key]:value}));setResult(null);setNotice('');setError('');};
  async function compare(e) {
    e.preventDefault(); if(busy)return;
    setBusy(true);setElapsed(0);setError('');setNotice('');setResult(null);
    const snapshot={...data}; controller.current=new AbortController();
    try {
      const response=await fetch('/api/compare',{method:'POST',headers:{'Content-Type':'application/json','X-Twofold-Token':status?.token||''},body:JSON.stringify({question:snapshot.question,answerA:snapshot.answerA,answerB:snapshot.answerB,web:snapshot.web}),signal:controller.current.signal});
      const body=await response.json(); if(!response.ok)throw Error(body.error||'Comparison failed.');
      setResult(body);setResultInput(snapshot);
      requestAnimationFrame(()=>{resultRef.current?.focus({preventScroll:true});resultRef.current?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
    } catch(err) {if(err.name==='AbortError')setNotice('Comparison canceled. OpenAI may have already processed part of the request.');else setError(err.message);}
    finally{setBusy(false);controller.current=null;}
  }
  return <><header className="topbar"><div className="nav-inner"><a className="brand" href="/" aria-label="Twofold home"><Icon type="logo"/>twofold</a><nav aria-label="Main navigation"><a href="#compare" className="active">Compare</a><button onClick={()=>howRef.current.showModal()}>How it works</button><a href="https://github.com/agammann/twofold" target="_blank" rel="noopener noreferrer">GitHub<Icon type="arrow" width="15" height="15"/></a></nav></div></header>
    <main id="compare"><div className="intro"><h1>Two answers. A clearer picture.</h1><p>Compare the reasoning. Check the claims. See what holds up.</p></div>
    {status && !status.configured && <div className="setup-message" role="status">{status.hosted ? <><strong>Comparisons are temporarily unavailable.</strong> Please try again later.</> : <><strong>Connect OpenAI to start comparing.</strong> Run <code>npm run setup</code> in the project folder, then restart Twofold. Your key stays in your local server.</>}</div>}
    <form onSubmit={compare}><label className="question-label" htmlFor="question">The question</label><textarea className="question" id="question" value={data.question} required minLength={3} maxLength={4000} rows={1} onChange={e=>update('question',e.target.value)} placeholder="What question were both answers responding to?" disabled={busy}/>
      <div className="answer-grid"><AnswerEditor id="A" data={data} update={update} disabled={busy}/><AnswerEditor id="B" data={data} update={update} disabled={busy}/></div>
      <div className="form-actions"><div className="secondary-actions"><button className="quiet" type="button" disabled={busy} onClick={()=>{setData(d=>({...d,answerA:d.answerB,answerB:d.answerA,nameA:d.nameB,nameB:d.nameA}));setResult(null);setNotice('Answers swapped.');setError('');}}><Icon type="swap"/>Swap answers</button><button className="quiet" type="button" disabled={busy} onClick={()=>{setData({...example});setResult(null);setError('');setNotice('Example loaded. Compare to get a live evaluation.');}}><Icon type="file"/>Load example</button></div>
      <div className="primary-actions"><label className="web-option"><input type="checkbox" checked={data.web} onChange={e=>update('web',e.target.checked)} disabled={busy}/>Check web sources</label><button className="primary" type="submit" disabled={busy||!status?.configured}>{busy?'Comparing…':'Compare answers'}{busy?<span className="spinner"/>:<Icon type="arrow"/>}</button></div></div>
      <p className="privacy">Your question and answers are sent to OpenAI only when you compare. {status?.hosted ? `This public site offers ${status.dailyLimit} shared comparisons per day, resetting at midnight UTC. No API key is needed.` : 'API charges apply.'}{data.web?' Web checking also sends relevant queries to search providers.':''}</p>
    </form>
    {busy && <div className="progress" role="status" aria-live="polite"><div><strong>{data.web?'Checking sources and comparing the answers…':'Examining the arguments and claims…'}</strong><p>{elapsed}s elapsed. A comparison can take up to 3 minutes.</p></div><button className="quiet" onClick={()=>controller.current?.abort()}>Cancel</button></div>}
    {error && <div className="error" role="alert">{error}</div>}{notice && <p className="notice" role="status">{notice}</p>}
    {result ? <Results result={result} input={resultInput} resultRef={resultRef}/> : !busy && <section className="empty-result"><div className="empty-symbol"><Icon type="logo" width="32" height="32"/></div><h2>Make room for a second look.</h2><p>Add the same question and two answers from any person or bot.<br/>Your comparison will appear here, with the reasoning and evidence behind it.</p></section>}
    <footer>An evaluation of the reasoning shown, not access to private thought processes.<span>{status?.hosted ? 'Hosted on OpenAI Sites' : 'Runs locally'} · No saved comparisons · OpenAI evaluation</span></footer></main>
    <dialog ref={howRef} aria-labelledby="how-title"><div className="dialog-header"><h2 id="how-title">How Twofold works</h2><button className="quiet" aria-label="Close explanation" onClick={()=>howRef.current.close()}><Icon type="close"/></button></div><ol className="how-steps"><li><strong>One question, two perspectives.</strong><p>Paste both answers, including their explanations. Names are optional, stay local, and are not sent to OpenAI.</p></li><li><strong>Examine the argument.</strong><p>OpenAI compares conclusions, assumptions, reasoning, and claims. Quoted steps must match the original text. Inferences are labeled.</p></li><li><strong>Follow the evidence.</strong><p>Optional web checking retrieves sources before evaluation. Only retrieved source URLs can appear as citations. A retrieved source is not automatically reliable.</p></li><li><strong>A verdict with room for nuance.</strong><p>Either answer, both, neither, conditional, or insufficient evidence. Confidence is qualitative. Evaluations can be wrong, and one model’s judgment is not proof.</p></li></ol><div className="dialog-note"><strong>Your data</strong><p>{status?.hosted ? 'Comparison text and results are not saved by Twofold. The site stores only a shared usage count and last request time to enforce public limits. Hosting infrastructure may retain request metadata.' : 'No database, analytics, or saved history.'} Inputs go to OpenAI when you compare; web checking can send search queries to search providers. API requests use store: false, but OpenAI’s provider retention policies still apply. Exported reports include your inputs. {status?.hosted ? 'The project API key stays private on the hosted server. Visitors do not supply a key.' : 'Your API key stays in the local server.'}</p><a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer">Read OpenAI’s data controls</a></div></dialog>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
