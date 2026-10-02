import test from 'node:test';
import assert from 'node:assert/strict';
import { compareInBrowser } from '../src/lib/compare.mjs';
import { input, report } from './fixtures.mjs';
import { markdownReport } from '../shared/export.mjs';

function responses(final = {}) {
  return ['A', 'B'].map(id => ({
    conclusion: input[`answer${id}`], reasoningExplanation: report[`answer${id}`].reasoning[0].explanation,
    reasoningBasis: 'The answer explicitly supplies this argument', reasoningQuote: report[`answer${id}`].reasoning[0].quote,
    strength: '', weakness: '', claim: '', claimQuote: '', assessment: 'uncertain',
    claimBasis: 'supplied text', claimExplanation: 'No claim selected.', sourceId: '',
  })).concat({
    agreement: 'None.', difference: 'The percentage bases differ.', limitation: '',
    betterAnswer: report.betterAnswer, rationale: report.rationale, verdict: 'Answer B is better supported',
    headline: report.headline, confidence: report.confidence, confidenceReason: report.confidenceReason,
    ...final,
  });
}

test('browser generation receives the schema in both its prompt and decoder options, without author labels', async () => {
  const values = responses(); let calls = 0;
  const result = await compareInBrowser({...input, nameA:'Private author label'}, '', undefined, async (messages, options) => {
    const prompt = JSON.parse(messages[1].content);
    assert.deepEqual(prompt.outputSchema, options.schema);
    assert.equal(JSON.stringify(messages).includes('Private author label'), false);
    if (calls === 2) assert.equal(options.schema.properties.headline.minLength, 1);
    else assert.equal(options.schema.properties.claimBasis.enum.includes('retrieved evidence'), false);
    return {value:values[calls++], model:'test-only', usage:{prompt_tokens:10,completion_tokens:20}};
  });
  assert.equal(calls, 3); assert.equal(result.verdict, 'B');
  assert.deepEqual(result.agreements, []);
  assert.deepEqual(result.meta.usage, {inputTokens:30,outputTokens:60});
  assert.match(markdownReport(input, result), /Source import requested: false\. Supplied pages retrieved: 0\./);
  assert.doesNotMatch(markdownReport(input, result), /Web search performed/);
});

test('an incomplete browser report produces guidance instead of raw schema diagnostics', async () => {
  const values = responses({headline:''});
  await assert.rejects(compareInBrowser(input, '', undefined, async () => ({value:values.shift(),model:'test-only'})),
    {message:'The browser model returned an incomplete report. Your answers are still in the form. Try again or choose another model.'});
});

test('incomplete browser assessments stop before another generation', async () => {
  const claim={claim:'The percentages cancel.',claimQuote:input.answerA,claimExplanation:'The claim is incorrect.'};
  const invalid=[
    {reasoningQuote:''},
    {reasoningQuote:'A quote not present in either answer.'},
    {reasoningExplanation:''},
    {reasoningBasis:'This is an unstated assumption required by the supplied argument'},
    {reasoningBasis:'No argument is supplied'},
    {...claim,claimQuote:''},
    {...claim,claimQuote:input.answerB},
    {...claim,claimExplanation:''},
    {...claim,claimBasis:'retrieved evidence'},
    {...claim,sourceId:'S99'},
    {claimQuote:input.answerA},
  ];
  for(const patch of invalid){
    const values=responses();Object.assign(values[0],patch);let calls=0;
    await assert.rejects(compareInBrowser(input,'',undefined,async()=>({value:values[calls++],model:'test-only'})),
      {message:'The browser model returned an incomplete report. Your answers are still in the form. Try again or choose another model.'});
    assert.equal(calls,1,JSON.stringify(patch));
  }
});

test('complete claims and optional empty or inferred reasoning remain available', async () => {
  const values=responses();
  Object.assign(values[0],{reasoningBasis:'No argument is supplied',reasoningExplanation:'',reasoningQuote:''});
  Object.assign(values[1],{reasoningBasis:'This is an unstated assumption required by the supplied argument',reasoningQuote:'',
    claim:report.claims[0].claim,claimQuote:report.claims[0].quote,claimExplanation:report.claims[0].explanation,
    assessment:'supported',claimBasis:'calculation'});
  const result=await compareInBrowser(input,'',undefined,async()=>({value:values.shift(),model:'test-only'}));
  assert.deepEqual(result.answerA.reasoning,[]);
  assert.equal(result.answerB.reasoning[0].basis,'inferred');
  assert.equal(result.answerB.reasoning[0].quote,'');
  assert.equal(result.claims.length,1);
  assert.equal(result.claims[0].answer,'B');
  assert.equal(result.claims[0].quote,input.answerB);
});
