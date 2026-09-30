# Hosting

The Sites Worker embeds an explicit frontend asset allowlist, including the browser model worker. `/api/status` reports browser inference. `/api/compare` returns 410 even if a legacy key exists. `/api/source` fetches bounded public HTTPS pages with redirect validation. CSP permits the pinned SDK and model-file hosts. Existing D1 bindings are retained for migration compatibility and do not enforce an AI quota. Remove unused provider secrets from the deployment configuration.
