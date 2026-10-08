# Twofold

Compare two answers to the same question. Examine the argument each answer actually makes, check disputed claims, and review an explained verdict with exact quotations.

[Use Twofold](https://twofold.alx21.chatgpt.site) · [Download source](https://github.com/agammann/twofold/releases/tag/v1.1.1) · [Verification](docs/VERIFICATION.md)

## Try a comparison

1. Start with **OpenAI with your key**, or choose the experimental **On this device** option.
2. Enter the question and both answers, or select **Load example**. Optional author labels stay local and are excluded from evaluation.
3. Optionally add up to three public HTTPS source-page URLs, one per line.
4. Compare, then inspect the verdict, reasoning, claims, source citations, and complete improved answer.
5. Export a Markdown report to keep the inputs and result. Refresh clears the form and current report.

## Choose a model

| Mode | What you need | Cost and data |
| --- | --- | --- |
| On this device | HTTPS or localhost, WebGPU, compatible graphics hardware, and space for a large first download | No API charge. Model files download from public hosts; prompts and generation stay on the device. |
| OpenAI with your key | Your own OpenAI Platform API key with model access and API billing | Usage is charged to your API account. This server forwards your question, answers, and supplied source text to OpenAI. No browser model download is needed. |

Device mode uses Qwen 3 4B as an experimental alternative. Browser models can omit claims, misinterpret reasoning, and produce inconsistent explanations even with a correct verdict. Treat reports as drafts to check, before relying on a conclusion. A larger model choice does not guarantee enough device memory or a correct result.

Hosted mode defaults to GPT-5.4. In one development run it passed all 25 fixed checks, while GPT-5.4 mini passed 23; mini remains an optional lower-cost choice with weaker evaluation. These checks cover verdicts, absent reasoning, and source labeling on a small synthetic suite, not general accuracy. Both models still require review. See [current API pricing](https://openai.com/api/pricing/). This mode uses API Platform billing, separate from ChatGPT subscription usage.

The app never falls back to a paid model automatically. Hosted comparisons require the visitor to supply a key and submit the comparison. No operator key or shared inference allowance is used. Cancel preserves the inputs and requests cancellation; usage already incurred may still be billed.

## Understand the evidence

Verdicts can favor A or B, find both correct or neither correct, depend on an unspecified condition, or find evidence insufficient. Identical answers cannot prefer one author or invent content differences.

Stated reasoning and claim quotations must match the attributed original answer. Inferred assumptions carry no fabricated quote. These checks establish correspondence to text, not truth or completeness. Confidence is the model's qualitative judgment, not a measured probability.

This edition retrieves pages you supply; it does not search for sources. Imports allow public HTTPS text pages with bounded size and redirects. Long, unreadable, or blocked pages fail visibly. Only retrieved URLs and known source IDs can appear as citations. Retrieval alone does not establish that a page is reliable or supports a claim.

## Privacy and credentials

The app has no saved comparison history. Author labels remain in the tab. Exports include the supplied question and answers.

- **Device mode:** model downloads use public hosts. Optional source import sends the chosen URL to this server, which fetches the page. Answers are not sent to an inference provider.
- **Hosted mode:** the key remains in tab memory and accompanies the comparison request to this server. It is forwarded only to the fixed OpenAI API endpoint, never to source websites. The app does not persist or log keys or comparisons. **Clear key**, refresh, or switching to device mode removes the key from app state. Keys are excluded from exports and browser storage.
- Hosted requests use `store: false`. This is not a promise of zero provider retention; [OpenAI's data policies](https://developers.openai.com/api/docs/guides/your-data) apply. Hosting and source sites may retain request metadata.

Only enter a key into an instance you trust. A short-lived, restricted verification key is preferable to a broadly privileged key. Never commit credentials to the repository or embed an operator key in a public frontend.

## Run locally

Use Node.js **24** and npm. Download `twofold_1.1.1_source.zip` and `SHA256SUMS` from Releases, verify the ZIP's SHA256 and extract it into a new folder. On Windows, `Get-FileHash .\twofold_1.1.1_source.zip -Algorithm SHA256` prints the value to compare with the checksum file. From the extracted root:

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:3210` or `http://localhost:3210` on the same computer. Stop the server with Ctrl+C. For development, run `npm run dev`. On Windows, `start.cmd` installs missing dependencies, builds and starts the same app; it does not request a server key. The first dependency or device-model download requires internet access.

No server-side API key is required: device mode needs none, and hosted mode uses the visitor's key supplied in the UI. Environment keys are not an inference fallback. The retained `setup`, `test:live` and `eval:live` commands belong to the earlier provider adapter; they are not part of the current browser setup or the no-charge verification commands.

Run `npm test`, `npm run build`, `npm run check:release` and `npm run audit:ci` before publishing from a Git checkout. Tests cover input bounds, exact quotations, source IDs, credential separation, provider-error redaction, source imports, cancellation, and the retired operator route. The release scan inspects staged source and therefore needs Git; running the app from an extracted ZIP does not.

For the browser regression, run `npx playwright install chromium chrome`, then `npm run test:e2e` and `npm run test:webmcp`. These intercept controlled hosted responses without a provider key or paid calls. The native check requires the genuine browser API and fails if absent; `TWOFOLD_BROWSER_EXECUTABLE` selects an installed compatible Chromium executable. Controlled transport tests are not model-accuracy benchmarks. Dated real-model results are in [docs/RELIABILITY.md](docs/RELIABILITY.md).

Twofold's optional native `prepare_comparison` tool fills the visible question and answers without starting inference. Review the form and submit it yourself. Ordinary use requires no native WebMCP support.

The public Worker serves an explicit frontend asset allowlist, bounded source imports, and `/api/compare/visitor`. The earlier `/api/compare` operator route remains retired with HTTP 410. Existing D1 migrations remain for deployment compatibility; no model quota database is used.

## License

[MIT](LICENSE) for the original source. Retain [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); dependencies and separately downloaded model weights have their own terms. [Support, upgrade and recovery](docs/STABILITY.md) explains the v1 boundaries and how to preserve reports.
