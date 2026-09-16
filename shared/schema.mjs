import { z } from 'zod';

const text = z.string().min(1).max(5000);
export const Input = z.object({
  question: z.string().trim().min(3).max(4000),
  answerA: z.string().trim().min(1).max(12000),
  answerB: z.string().trim().min(1).max(12000),
  nameA: z.string().trim().max(80).default(''),
  nameB: z.string().trim().max(80).default(''),
  web: z.boolean().default(false),
}).strict();

const Step = z.object({
  explanation: text,
  basis: z.enum(['stated', 'inferred']),
  quote: z.string().max(2000),
});
const Answer = z.object({
  conclusion: text.describe('Summarize the conclusion made by this answer. Do not replace the summary with just Correct or Incorrect.'),
  reasoning: z.array(Step).min(1).max(5),
  strengths: z.array(text).max(4),
  weaknesses: z.array(text).max(4),
});
const Claim = z.object({
  claim: text,
  answer: z.enum(['A', 'B', 'both']),
  assessment: z.enum(['supported', 'contradicted', 'uncertain']),
  basis: z.enum(['calculation', 'retrieved evidence', 'model assessment', 'supplied text']),
  explanation: text,
  quote: z.string().min(1).max(2000).describe('Exact excerpt from the answer that makes this claim. Attribution must match the answer field.'),
  sourceIds: z.array(z.string()).max(6),
});
export const Report = z.object({
  verdict: z.enum(['A', 'B', 'both', 'neither', 'depends', 'insufficient']),
  headline: text,
  confidence: z.enum(['low', 'medium', 'high']),
  confidenceReason: text,
  rationale: text,
  answerA: Answer,
  answerB: Answer,
  agreements: z.array(text).max(4),
  differences: z.array(text).min(1).max(5),
  claims: z.array(Claim).min(1).max(6),
  betterAnswer: z.string().min(40).max(5000).describe('A complete standalone answer to the original question, including a concise explanation. Never just a letter, winner label, or reference to another answer.'),
  limitations: z.array(text).min(1).max(5),
});

export function quoteOptions(original) {
  const chunks = [];
  // Keep every option an exact substring. Bound quote lengths and enum size.
  for (const paragraph of original.split(/\n+/)) {
    for (let offset = 0; offset < paragraph.length; offset += 480) {
      const chunk = paragraph.slice(offset, offset + 480).trim();
      if (chunk) chunks.push(chunk);
    }
  }
  return [...new Set(chunks)];
}

export function reportSchemaFor(input) {
  const answerSchema = original => Answer.extend({ reasoning: z.array(z.discriminatedUnion('basis', [
    z.object({ explanation: text, basis: z.literal('stated'), quote: z.enum(quoteOptions(original)) }),
    z.object({ explanation: text, basis: z.literal('inferred'), quote: z.literal('') }),
  ])).min(1).max(5) });
  const claims = ['A', 'B'].map(id => Claim.extend({ answer: z.literal(id), quote: z.enum(quoteOptions(input[`answer${id}`])) }));
  const common = quoteOptions(input.answerA).filter(q => input.answerB.includes(q));
  if (common.length) claims.push(Claim.extend({ answer: z.literal('both'), quote: z.enum(common) }));
  return Report.extend({ answerA: answerSchema(input.answerA), answerB: answerSchema(input.answerB), claims: z.array(z.discriminatedUnion('answer', claims)).min(1).max(6) });
}
