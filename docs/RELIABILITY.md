# Comparison reliability

## October 7, 2026: first responses for 1.1.1

Four browser comparisons used factual criteria frozen before inference. GPT-5.4 correctly identified the 4% loss after a 20% increase and decrease, preserved unknown contents as `insufficient` with no invented reasoning, and cited the actual retrieved Example Domain page for its documentation purpose. GPT-5.4 mini also returned `insufficient` with empty reasoning for the sealed box. All four actual exports were read back. No response was replaced by a quality retry.

These visible cases check calculation, absent reasoning and source attribution. They do not replace the larger historical run, erase its adverse results, or establish broad accuracy. Review the original answers and every claim before relying on a generated report.

A first Qwen 3 4B device comparison returned B, the correct 96/4% calculation, exact attributed quotations and no invented agreement. It nevertheless described the incorrect A explanation as a strength: "a simple explanation that may be misunderstood by some." That vague praise is misleading for a mathematically false argument. This response was retained without a quality retry. Download and generation cancellation recovered with the input intact and no hosted request; the completed comparison took about three minutes on the tested AMD RDNA 3 adapter. Device mode remains experimental.

## October 2, 2026: visitor-key workflow

The visitor-key route was exercised with real OpenAI Responses requests from the local production server. Twelve fixed synthetic cases were run in both answer orders, plus a retrieved-page case using example.com. The checks cover the expected verdict, missing reasoning on bare assertions, exact quotation validation, and source classification; they do not establish that every generated sentence is correct.

| Model, medium reasoning | Passed checks | Observed failures |
| --- | --- | --- |
| GPT-5.4 | 25 / 25 | None in this run |
| GPT-5.4 mini | 23 / 25 | One sealed-box response labeled unknown evidence as neither; the sourced case attributed reasoning to bare assertions. |

GPT-5.4 is the hosted default. Mini remains an explicit lower-cost alternative. These are single development runs on visible cases, not a held-out benchmark, an accuracy percentage, or a promise of order independence. Model aliases and outputs can change. The source-label instructions were tightened after an earlier report mislabeled retrieved evidence as supplied text.

Actual Chrome comparisons produced reports and Markdown downloads. Edge verification additionally covered native WebMCP preparation without submission, invalid-key rejection by OpenAI, cancellation with preserved inputs, immediate successful retry, export, key clearing on mode changes and reload, and layouts at 1440, 390, and 320 pixels. One longer Chrome run timed out while taking a screenshot after its comparisons and exports had succeeded; that screenshot failure is not counted as a passing visual check.

The Qwen 3 4B device run completed a real comparison and export on WebGPU, but invented an agreement between answers with opposing conclusions. It remains explicitly experimental. The smaller device models were removed from the supported choices after basic comparison runs failed report validation. Exact-quote checks do not establish semantic correctness. Hosted and device reports both require review.

The sections below preserve historical measurements from the earlier provider edition.


## September 19, 2026: public workflow review

Five completed comparisons through the public browser interface returned the expected verdicts: percentage arithmetic in both answer orders, a capacity-constrained plan choice, Python sorting with web research, and a sealed box with no observations. These were synthetic visitor scenarios using real OpenAI calls, not a study with recruited users.

The sealed-box report correctly returned `insufficient`, but restated its bare assertions as reasoning steps. The generation instructions now explicitly exclude conclusion restatements from reasoning. A new `sealed-box` regression case requires both `insufficient` and empty reasoning arrays. After the change, both answer orders passed against live GPT 5.4 Mini (3,964 input and 1,348 output tokens total). This improves a measured failure; prompt instructions do not guarantee every future report will comply.

The web report also listed one Python documentation page twice, with and without `utm_source`. Source collection now deduplicates UTM variants while retaining an actually retrieved link and preserving meaningful query parameters. A deterministic regression covers these boundaries. Different documentation versions, languages, and fragments remain separate; source count is not a count of independent confirmations.

The current corpus contains twelve cases and runs 24 paid evaluations. Only the new case was rerun in both orders for this targeted change; the complete historical run below remains historical.

## Version 1.0.2: conditional recommendations

A recommendation that depends on an unspecified deciding priority should receive `depends`, even when both individual conditional statements are true. If the priority is explicit, apply it. Two answers that correctly answer the question under the same supplied conditions can receive `both`, including two complete explanations of the same tradeoff. Missing factual observations and unsupported guesses about personal preferences still require `insufficient`. These rules guide model generation; they are not a mechanical guarantee of semantic correctness.

Before this run, the courier case was changed to require `depends`, and three new cases were added: a fictional storage tradeoff, an explicit delivery deadline, and two equivalent capacity recommendations. That corpus had eleven cases and made 22 API requests, with nine distinct answer swaps and two identical answer repeats. The earlier rubric and results are preserved below.

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

Run `npm test` for deterministic checks without API charges. The current `npm run eval:live` runs twelve fixed synthetic cases in [the corpus](../evaluations/cases.mjs), in original and reversed order, for 24 paid requests with web research off. It saves complete reports to the ignored `evaluation-results/latest.json` file. Run one pair with `npm run eval:live -- --case identical-wrong`. The historical version 1.0.1 run below used eight cases and 16 requests.

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
