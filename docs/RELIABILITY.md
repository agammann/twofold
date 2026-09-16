# Comparison reliability

## Version 1.0.2: conditional recommendations

A recommendation that depends on an unspecified deciding priority should receive `depends`, even when both individual conditional statements are true. If the priority is explicit, apply it. Two answers that correctly answer the question under the same supplied conditions can receive `both`, including two complete explanations of the same tradeoff. Missing factual observations and unsupported guesses about personal preferences still require `insufficient`. These rules guide model generation; they are not a mechanical guarantee of semantic correctness.

Before this run, the courier case was changed to require `depends`, and three new cases were added: a fictional storage tradeoff, an explicit delivery deadline, and two equivalent capacity recommendations. The current corpus has eleven cases and makes 22 API requests, with nine distinct answer swaps and two identical answer repeats. The earlier rubric and results are preserved below.

The single measured version 1.0.2 run passed all 22 verdict and missing reasoning checks. All eleven pairs had matching mapped verdicts, so the live command exited successfully. The courier and storage tradeoffs returned `depends` in both orders; the explicit deadline preferred Y in both orders; the capacity recommendations returned `both`. GPT 5.4 Mini with medium reasoning used 42,482 input and 20,412 output tokens. See the appended [run summary](reliability-results.json). This is one development regression run, not a general accuracy estimate or proof of order independence.

Manual review of the 22 rationales, improved answers, and claim assessments found an omission outside the automatic rubric: the original order storage improved answer recommends Large for needs above 20 GB without restating its 100 GB maximum. The reversed answer includes that bound. The verdict checks pass, but generated answer completeness remains imperfect.

After the local execution restriction was lifted, all 21 tests passed with the standard test runner, including the staged secret regression. A fresh production build and the unmodified release gate passed across 40 tracked files and four built assets, including configured key matching and private HTTP exposure probes. The full test, build, release check, and audit commands also run in the Windows and Ubuntu [verification workflow](https://github.com/agammann/twofold/actions/workflows/verify.yml). The frontend source is unchanged in this update.

## Version 1.0.1 history

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

Run `npm test` for deterministic checks without API charges. The current `npm run eval:live` runs eleven fixed synthetic cases in [the corpus](../evaluations/cases.mjs), in original and reversed order, for 22 paid requests with web research off. It saves complete reports to the ignored `evaluation-results/latest.json` file. Run one pair with `npm run eval:live -- --case identical-wrong`. The historical version 1.0.1 run below used eight cases and 16 requests.

The scorer checks verdicts against a declared rubric and checks for invented reasoning on bare conclusions. It maps reversed A/B verdicts back to their original labels before comparing consistency. In version 1.0.1, the two identical answer cases were repeat checks; the other six pairs swapped distinct answer texts. The conditional courier case allowed both `depends` and `both`, since both recommendations explicitly state their conditions. The expected rubric was established before the measured runs.

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
