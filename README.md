# Twofold

Compare two answers to the same question. Examine stated reasoning, check disputed claims, and see what the evidence supports.

[Use Twofold](https://twofold.alx21.chatgpt.site)

## Use the browser edition

1. Enter the question and both answers. Author labels are optional and excluded from evaluation.
2. Optionally add up to three public HTTPS source-page URLs.
3. Select **Compare answers**, then review the verdict, exact quotes, claims, reasoning and complete improved answer.
4. Export a Markdown report if desired. Refresh clears the current comparison.

No API key, paid AI API or shared daily AI allowance is used. The model runs on the visitor's graphics device.

The first run downloads model files from public hosts. Text generation runs in a dedicated browser worker using WebLLM; prompts are not sent to a hosted model. This workflow defaults to Qwen 3 4B. Smaller Qwen 3 1.7B and Llama 3.2 1B choices use less memory but can produce substantially weaker drafts. Model downloads are cached when browser storage permits.

Use HTTPS (or localhost) and a current browser with WebGPU and compatible graphics hardware. A model choice does not guarantee that every device has enough memory. Download speed, inference speed and answer quality depend on the device and model. Stop a download or generation from the interface; errors preserve existing inputs. There is no paid model fallback. Hosting and model-download bandwidth remain separate from AI API fees.

## What changed

The report structure and exact-quote validation remain. Model judgment can differ from the earlier hosted model and must be reviewed. Verdicts remain A, B, both, neither, depends or insufficient. Identical answers cannot prefer one author or claim content differences.

Paid web search has been replaced with retrieval of pages the visitor supplies. This edition does not automatically discover sources. Only actually retrieved URLs and known source IDs may appear as citations. A page's inclusion does not establish reliability or support for a claim. Imports are bounded; long or blocked pages fail visibly instead of being silently truncated.

## Privacy

Questions, answers and generation stay in this tab. Public hosts provide model files. Optional source import sends only the chosen URL to the app server, which fetches that page. Hosting and source sites may retain request metadata. Reports contain the supplied answers. There is no saved comparison history or paid provider request. `/api/compare` is retired and returns 410.

## Run locally

Node.js 22.12+ and npm are required. Run `npm ci`, `npm run build`, then `npm start`; open `http://127.0.0.1:3210`. For development use `npm run dev`. No AI secret or setup prompt is required.

Run `npm test` and `npm run build`. Hosted tests verify that retired inference cannot call a provider, asset responses permit the required browser model hosts, and files outside the explicit frontend allowlist are unavailable. Historical provider reliability results are preserved in [docs/RELIABILITY.md](docs/RELIABILITY.md); they are not browser-model benchmarks.

The public Worker serves explicitly embedded frontend assets and bounded public source imports. Existing D1 migrations are retained for deployment compatibility; no AI usage counter is used. SDK code and model assets load only when requested.

## License

No open source license has been selected for this repository. Contact the owner before redistribution. Model weights and third-party dependencies have their own licenses.
