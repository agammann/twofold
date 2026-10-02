# Hosting

The Sites Worker embeds an explicit frontend asset allowlist, including the browser model worker. `/api/status` reports device mode and `visitorHosted: true`. Its legacy `paidInference: false` field means that the operator-funded route remains unavailable; visitor-key comparisons can incur charges to that visitor.

`POST /api/compare/visitor` accepts same-origin JSON requests with an explicit visitor bearer key. It allows GPT-5.4 mini and GPT-5.4, bounds request size and generation, disables provider response storage and retries, and forwards requests only to `https://api.openai.com/v1/responses`. Source URLs are fetched and parsed on the server without forwarding the key. Errors are sanitized. No deployment key, database, or shared model quota funds this route.

`/api/compare` remains retired with HTTP 410 even if a legacy operator key exists. `/api/source` retrieves bounded public HTTPS pages with redirect validation for device mode. CSP permits the pinned browser SDK and model-file hosts; browser clients do not contact the OpenAI API directly.

Existing D1 bindings are retained for migration compatibility and do not enforce an AI quota. Remove unused provider secrets from deployment configuration. Build with `npm run build`; publish only the resulting `dist` artifact. Keep credentials and private verification files outside the artifact.
