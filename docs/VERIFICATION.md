# Verification evidence

Verified September 15, 2026 (Pacific time; September 16 UTC). These checks establish the observed build and workflow, not universal evaluation accuracy or freedom from vulnerabilities.

## Working application

| Check | Observed result |
| :--- | :--- |
| Automated tests | All 17 passed, including input bounds, browser origin and token controls, safe errors, quotation attribution, source membership, export escaping, and a staged secret regression. |
| Production build | Vite build passed. Frontend JavaScript was approximately 240 kB before compression. |
| Production dependency audit | npm audit reported zero known vulnerabilities at verification time. |
| Windows launcher | start.cmd built and started the production server using the configured Node and npm runtime. |
| Windows credential setup | Interactive setup with a disposable fake key passed. The file had protected access rules containing only the operator, SYSTEM, and Administrators. No real key was used in this test. |
| Arithmetic through live OpenAI | Answer B selected, with 100 × 1.2 × 0.8 = 96 and a complete improved answer. Final browser run used 1,422 input and 1,262 output tokens. |
| Web research through live OpenAI | Python list mutability comparison selected B and returned 13 retrieved source entries in the smoke test. Source collection preceded the structured evaluation. |
| Browser interactions | Example loading, answer and author swapping, live loading state, cancellation, report navigation, and the privacy explanation were exercised. No browser console errors were observed in that flow. |
| Export | The Export report control wrote an actual Markdown download. Its contents were read back and checked against the displayed comparison. See the [example report](example-report.md). |

Live checks used a real, privately configured OpenAI project key. Automated tests and GitHub Actions use controlled provider doubles and do not receive that key. The web smoke test establishes provider connectivity and citation plumbing; it does not constitute a comprehensive benchmark.

One exploratory model response added an incorrect generalization about the order of percentage changes. Evaluation instructions were tightened to check additional qualifications and avoid unsupported additions. The final observed response omitted that error. This illustrates why model judgments and confidence are explicitly labeled in the interface; prompt changes do not guarantee correctness.

## Visual verification

The generated [design reference](design-reference.png) and final [desktop screenshot](twofold-desktop.png) were inspected together. The screenshot contains a real returned evaluation. The [mobile screenshot](twofold-mobile.png) captures the same workflow in a narrow viewport.

| Visual anchor | Reference and implementation comparison |
| :--- | :--- |
| Header | Compact wordmark, restrained navigation, and an active blue Compare link are retained. The implemented mark uses two overlapping answer sheets. |
| Heading | The same headline and supporting line sit above the form in bold system typography. |
| Question | A single wide question field leads the flow, before the two answer groups. |
| Answer groups | Equal desktop columns, neutral header strips, blue A and violet B identities, author fields, and answer text areas match the hierarchy. |
| Actions | Swap and example controls stay secondary. Web checking and the blue comparison button form the primary action group. |
| Report | A divider, export action, Verdict/Reasoning/Claims/Sources navigation, and a pale blue verdict surface preserve the reference structure. |
| Reading | Longer verdict and improved answer text use a serif reading face; controls, labels, and evidence detail use system sans serif. |

Intentional differences: the implemented content width is about 1,120 CSS pixels; generous editor height and real result text move the expanded reasoning below the initial desktop viewport. The generated reference's fabricated counts and provider names were removed. Actual limits are 4,000 question characters and 12,000 per answer. Names start empty. Web checking starts off, and no report appears until an evaluation succeeds. The live report includes exact excerpts, confidence explanations, limitations, and source status beyond the concept preview.

Responsive checks used 390 × 844, 768 × 1024, and 1,440 × 1,120 viewport settings. At 390 pixels, answer and reasoning groups stack and claims remain readable. At 768 pixels the report columns fit. Observed document width did not exceed viewport width. These are desktop browser viewport checks, not physical mobile device testing. Temporary viewport overrides were reset afterward.

## Publication and security scope

Before publication, the release gate checks the exact staged blobs, working copies, and built assets for the configured key and common secret patterns. Production HTTP probes cover private environment paths, Git configuration, server source, setup source, and an arbitrary filesystem route. The release check passed across 34 staged files and four built files. All six private paths returned 404; the status response contained no configured key, and the production page supplied a Content Security Policy.

An independent source review covered application access controls, credential handling, provider output, exports, launchers, and CI. Two issues in intermediate scripts were fixed before release: Windows permissions must be established before writing a new secret, and release scanning must inspect staged blobs even when the working copy has been cleaned. The latter has a regression test. The first was verified with an actual disposable setup run, including permission readback. Initial review snapshots and later remediation are separate evidence.

Dependency internals were not manually audited. The app trusts local programs and users on the same computer and is not a multiuser hosted service. Model bias, semantic citation accuracy, and complete resistance to prompt injection are not established. See [privacy and local security](PRIVACY.md).

The public [verification workflow](https://github.com/agammann/twofold/actions/workflows/verify.yml) runs tests, build, release checks, and dependency audit on Windows and Ubuntu. Consult the run tied to the current commit for its exact status.
