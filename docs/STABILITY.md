# Version 1 support and recovery

Use Node.js 24 and npm for the source application on Windows x64 or Linux. The dated verification record identifies the exact tested runtimes. The ordinary browser workflow does not require native WebMCP. Its optional native tool prepares the form for review and never starts a comparison.

GPT-5.4 is the initial hosted model. Visitors supply their own API key and submit each comparison; opening the page, loading an example or preparing the form incurs no inference request. GPT-5.4 mini is an optional lower-cost model with weaker recorded results. Qwen 3 4B remains experimental device inference and needs WebGPU, compatible graphics hardware, memory and a large download. No automatic paid fallback is used. Model judgments require source review in every mode.

## Preserve and recover your work

The app has no saved comparison history. Export the Markdown report before reloading or closing; the export includes the question, both answers and the result. Retain original source independently when needed. Browser model caches are separate from comparison data.

Cancel stops waiting and requests cancellation while preserving editable inputs. A provider may already have processed and charged for its request. Correct a failed key, shorten rejected input or choose an accessible model before submitting again. Clear key, switching to device mode and reload remove the visitor key. Keep it out of inputs, URLs, screenshots and exports.

Source import uses only supplied public HTTPS page URLs and has size, redirect and content limits. A blocked or unreadable page fails visibly; choose another page or remove it. Imported text is evidence to inspect, not a guarantee of reliability. The app does not perform an independent web search.

For a broken local installation, stop its server and install the same release's locked dependencies in a new extraction. For an upgrade, export useful work, stop the old instance, extract the new release separately and run `npm ci`, `npm test`, `npm run build` and `npm start`. Keep the old extraction until the newcomer workflow succeeds. No local comparison database or operator-key file needs migration.

Existing deployment D1 bindings/migrations are retained for compatibility; the visitor-key website does not use the retired operator allowance. Requests to `/api/compare` remain retired with HTTP 410. Support reports should include the release, browser/runtime/model, interface, minimal nonprivate inputs and expected/observed result; include no credentials.
