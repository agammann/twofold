import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreResult, summarizeRuns } from '../evaluations/scoring.mjs';
import { report } from './fixtures.mjs';

test('live evaluation scoring maps reversed winners and detects invented reasoning',()=>{
  const testCase={answerA:'5.',answerB:'4.',expected:['B'],noReasoning:true};
  const r=structuredClone(report);r.answerA.reasoning=[];r.answerB.reasoning=[];
  assert.equal(scoreResult(testCase,r).passed,true);
  assert.equal(scoreResult(testCase,r,true).passed,false);
  r.verdict='A';assert.equal(scoreResult(testCase,r,true).passed,true);
  r.answerA.reasoning=[{explanation:'Invented explanation'}];
  assert.equal(scoreResult(testCase,r,true).passed,false);
});

test('live evaluation summary distinguishes order changes and request failures',()=>{
  const original={...structuredClone(report),verdict:'B'};
  const reversed={...structuredClone(report),verdict:'A'};
  original.meta.usage={inputTokens:10,outputTokens:20};
  reversed.meta.usage={inputTokens:15,outputTokens:25};
  const runs=[{caseId:'x',swapped:false,report:original,score:{passed:true}},{caseId:'x',swapped:true,report:reversed,score:{passed:true}},{caseId:'failed',swapped:false,error:'Provider failure',score:{passed:false}}];
  let summary=summarizeRuns(runs);
  assert.equal(summary.total,3);assert.equal(summary.passed,2);assert.equal(summary.failed,1);
  assert.equal(summary.orderChecks.length,1);assert.equal(summary.orderConsistent,1);
  assert.deepEqual(summary.usage,{inputTokens:25,outputTokens:45});
  reversed.verdict='B';summary=summarizeRuns(runs);
  assert.equal(summary.orderConsistent,0);
});
