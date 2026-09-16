# Comparison reliability

Version 1.0.1 addresses two concrete causes of misleading reports: requiring content in sections that may have nothing to report, and leaving the meanings of the verdict categories ambiguous.

## Product changes

Reasoning, differences, claims, and limitations may now be empty. The interface and Markdown export explain when the evaluator did not identify content for a section. A missing explanation should remain missing instead of being reconstructed from a bare answer.

When answer text is identical after input trimming, the generation schema forbids A/B winner labels and differences. Server validation independently enforces that rule. This establishes equal treatment of identical content, not correctness: both identical answers can be false.

The output schema places the answer assessments, claims, and improved answer before the rationale and verdict. This gives the evaluator a chance to assess the material before selecting its final label. It is a generation aid, not a proof procedure.

Verdict meanings are explicit:

| Verdict | Meaning |
| :--- | :--- |
| A or B | A substantive supported advantage. Being less wrong than another false answer is not enough. |
| Both | Both answers are substantively correct. |
| Neither | There is affirmative evidence that both central answers are false. |
| Depends | The choice changes with a stated condition, goal, or preference. |
| Insufficient | Missing evidence prevents determining truth. Unsupported does not mean disproved. |

## Reproducible checks

Run `npm test` for deterministic checks without API charges. Run `npm run eval:live` for the eight fixed synthetic cases in [the corpus](../evaluations/cases.mjs), in original and reversed order. This makes 16 OpenAI requests with web research off and saves complete reports to the ignored `evaluation-results/latest.json` file. Run one pair with `npm run eval:live -- --case identical-wrong`.

The scorer checks verdicts against a declared rubric and checks for invented reasoning on bare conclusions. It maps reversed A/B verdicts back to their original labels before comparing consistency. The two identical answer cases are repeat checks; the other six pairs swap distinct answer texts. The conditional courier case allows both `depends` and `both`, since both recommendations explicitly state their conditions. The expected rubric was established before the measured runs.

Results and known failures from this development pass are recorded in [the run summary](reliability-results.json). Full generated reports stay local. The initial run used an intermediate implementation with optional sections but without the refined verdict definitions or reordered output. It is not a measured baseline of the original published version.

| Measured run | Verdict and missing reasoning checks | Exact mapped verdict consistency |
| :--- | :--- | :--- |
| Initial intermediate implementation | 8 of 16 passed | 7 of 8 pairs matched |
| Revised definitions and output order | 16 of 16 passed | 7 of 8 pairs matched |

The revised run used GPT 5.4 Mini with medium reasoning effort, totaling 27,720 input and 14,026 output tokens across the 16 calls. The remaining label variation was the courier tradeoff: `depends` in original order and `both` in reversed order. Both are within the rubric declared for that case, but the strict consistency diagnostic still flags the difference. The live suite therefore exits with status 1 on that observed run. Its rubric checks passed; the full diagnostic was not completely green. This variation remains documented rather than relaxing the scorer after seeing the result.

All 21 deterministic tests passed locally. The browser flow was checked separately with identical incorrect answers, including the empty section text and report export. Current CI results are available from the repository's verification workflow.

## Boundaries

These are small, visible regression cases used during development, not a held out benchmark. Verdict consistency does not imply correctness, and a passing verdict does not establish that every generated sentence is accurate. The test does not score semantic quotation entailment, every caveat, source quality, current events, adversarial prompts, or broad domain expertise. Real model runs vary. No calibrated probability or universal accuracy percentage is claimed.

Exact quotation and citation membership checks remain in place. They establish that an excerpt or source identifier exists, not that the model's interpretation is correct. The app's existing credential, loopback, request size, and request rate controls remain in effect. The earlier security report covers the original release and its stated scope; it has not been relabeled as an audit of this update.
