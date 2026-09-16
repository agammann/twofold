import { loadEnvFile } from 'node:process';
import { mkdirSync, writeFileSync } from 'node:fs';
import OpenAI from 'openai';
import { evaluate, EvaluationError } from '../server/evaluate.mjs';
import { cases } from '../evaluations/cases.mjs';
import { scoreResult, summarizeRuns } from '../evaluations/scoring.mjs';

// Reports contain only these fixed synthetic cases. Keep generated results local.
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--case' || !cases.some(c => c.id === args[1]))) {
  console.error(`Usage: npm run eval:live [-- --case <id>]\nCases: ${cases.map(c => c.id).join(', ')}`);
  process.exit(1);
}
try { loadEnvFile(new URL('../.env.local', import.meta.url)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
if (!process.env.OPENAI_API_KEY) { console.error('Configure your API key with npm run setup first.'); process.exit(1); }
const model = process.env.OPENAI_MODEL || 'gpt-5.4-mini';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: 'https://api.openai.com/v1', maxRetries: 0, timeout: 175000 });
const selected = args.length ? cases.filter(c => c.id === args[1]) : cases;
const runs = [];
console.log(`Running ${selected.length * 2} live evaluations with ${model}. API charges apply. Web research is off.`);
for (const testCase of selected) {
  for (const swapped of [false, true]) {
    const input = { question: testCase.question, answerA: swapped ? testCase.answerB : testCase.answerA, answerB: swapped ? testCase.answerA : testCase.answerB, web: false };
    let run;
    try {
      const report = await evaluate(input, { client, model, signal: AbortSignal.timeout(180000) });
      run = { caseId: testCase.id, swapped, input, report, score: scoreResult(testCase, report, swapped) };
    } catch (error) {
      run = { caseId: testCase.id, swapped, input, error: error instanceof EvaluationError ? error.message : 'Provider request failed. Check project access, billing, or connection.', score: { passed: false } };
    }
    runs.push(run);
    console.log(JSON.stringify({ case: testCase.id, order: swapped ? 'reversed' : 'original', passed: run.score.passed, verdict: run.report?.verdict, failures: run.score.failures, error: run.error }));
  }
}
const summary = summarizeRuns(runs);
const directory = new URL('../evaluation-results/', import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL('latest.json', directory), JSON.stringify({ createdAt: new Date().toISOString(), model, scope: 'Fixed synthetic cases; verdict and missing-reasoning checks only. This does not establish general accuracy or order independence.', summary, runs }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log('Saved evaluation-results/latest.json locally. This directory is ignored by Git. Usage excludes failed calls when the provider did not return usage.');
if (summary.failed || summary.orderConsistent !== summary.orderChecks.length) process.exitCode = 1;
