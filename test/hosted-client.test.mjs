import test from 'node:test';
import assert from 'node:assert/strict';
import { compareWithVisitorKey } from '../src/lib/hosted-compare.mjs';

const input = { question: 'Which answer is correct?', answerA: 'Four.', answerB: 'Five.' };
const compare = (value = input, signal) => compareWithVisitorKey(value, '', 'test-placeholder', 'gpt-5.4-mini', signal);

test('invalid comparison text gives guidance before any request', async t => {
  const request = t.mock.method(globalThis, 'fetch', () => { throw Error('Unexpected request'); });
  for (const invalid of [{ ...input, question: '   ' }, { ...input, answerA: '\n ' }, { ...input, answerB: '' }]) {
    await assert.rejects(compare(invalid), {
      name: 'Error',
      message: 'Enter a question of at least three characters and two answers containing text, within the form limits.',
    });
  }
  assert.equal(request.mock.callCount(), 0);
});

test('cancellation during response-body reading remains an AbortError', async t => {
  const canceled = new DOMException('Comparison canceled.', 'AbortError');
  const response = new Response(new ReadableStream({ start(controller) { controller.error(canceled); } }));
  t.mock.method(globalThis, 'fetch', async () => response);
  await assert.rejects(compare(), error => error === canceled);
});

test('unreadable response bodies still give report-recovery guidance', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>Service unavailable</html>'));
  await assert.rejects(compare(), {
    message: 'The comparison service did not return a report. Your answers are still in the form.',
  });
});
