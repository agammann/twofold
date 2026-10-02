import { Input } from '../../shared/schema.mjs';

export async function compareWithVisitorKey(raw, sourceText, apiKey, model, signal) {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) throw Error('Enter a question of at least three characters and two answers containing text, within the form limits.');
  const input = parsed.data;
  const sourceUrls = [...new Set(sourceText.split(/\s+/).filter(Boolean))];
  if (sourceUrls.length > 3) throw Error('Use up to three source URLs per comparison.');
  if (!apiKey.trim()) throw Error('Enter your OpenAI API key to use hosted mode.');
  const response = await fetch('/api/compare/visitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
    body: JSON.stringify({ input: { question: input.question, answerA: input.answerA, answerB: input.answerB }, sourceUrls, model }),
    signal,
  });
  let data;
  try { data = await response.json(); }
  catch (error) {
    signal?.throwIfAborted();
    if (error?.name === 'AbortError') throw error;
    throw Error('The comparison service did not return a report. Your answers are still in the form.');
  }
  if (!response.ok) throw Error(data.error || 'The hosted comparison failed. Your answers are still in the form.');
  return data;
}
