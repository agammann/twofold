import { verdictLabels } from './labels.mjs';

// Escape model text so exported Markdown cannot introduce images or raw HTML.
const clean = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/([\\`*_{}\[\]()#!|])/g,'\\$1');
export function markdownReport(input, report) {
  const lines=['# Twofold comparison','',`Created: ${report.meta.createdAt}`,`Model: ${report.meta.model}`,'','## The question',clean(input.question),''];
  for (const id of ['A','B']) lines.push(`## Answer ${id}${input[`name${id}`]?`: ${clean(input[`name${id}`])}`:''}`,clean(input[`answer${id}`]),'');
  lines.push('## Verdict',verdictLabels[report.verdict],clean(report.rationale),'',`Confidence: ${report.confidence} (qualitative model assessment)`,clean(report.confidenceReason),'');
  for (const id of ['A','B']) {
    const answer=report[`answer${id}`];lines.push(`## How ${id} gets there`,clean(answer.conclusion),'');
    answer.reasoning.forEach((s,i)=>lines.push(`${i+1}. ${clean(s.explanation)} (${s.basis})`,...(s.quote?['',`> ${clean(s.quote).replace(/\n/g,'\n> ')}`]:[]),''));
    lines.push('### Strengths',...answer.strengths.map(s=>`* ${clean(s)}`),'','### Weaknesses',...answer.weaknesses.map(s=>`* ${clean(s)}`),'');
  }
  lines.push('## Agreements',...report.agreements.map(d=>`* ${clean(d)}`),'','## Differences',...report.differences.map(d=>`* ${clean(d)}`),'','## Claims');
  for (const c of report.claims) lines.push('',`### ${clean(c.claim)}`,`Answer: ${c.answer} | Assessment: ${c.assessment} | Basis: ${c.basis}`,`Quoted claim: ${clean(c.quote)}`,clean(c.explanation),`Sources: ${c.sourceIds.join(', ')||'None'}`);
  lines.push('','## A better answer',clean(report.betterAnswer),'','## Limitations',...report.limitations.map(l=>`* ${clean(l)}`),'','## Retrieved sources');
  for (const s of report.sources) lines.push(`* ${s.id}: [${clean(s.title)}](${s.url.replace(/[\s()<>]/g,c=>encodeURIComponent(c))})`);
  lines.push('',`Web requested: ${report.meta.webRequested}. Web search performed: ${report.meta.searched}.`,`Tokens: ${report.meta.usage.inputTokens} input, ${report.meta.usage.outputTokens} output.`,'','Twofold evaluates the reasoning shown. It cannot recover private thought processes. Its judgment can be wrong.');
  return lines.join('\n');
}
