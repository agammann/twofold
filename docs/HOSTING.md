# Hosted Twofold

The public application runs on OpenAI Sites at https://twofold.alx21.chatgpt.site. Visitors can compare answers without installing software or supplying a key. Local operation remains available from the same repository.

The Cloudflare Worker calls the existing evaluator with GPT 5.4 Mini, medium reasoning, no SDK retries, bounded input/output, and an optional bounded web research step. The API key is a private Sites environment secret, never build input or frontend configuration.

A generated Drizzle migration creates a single D1 usage row. One atomic SQL upsert reserves each comparison before provider work, enforces 30 comparisons per UTC day and at least 10 seconds between accepted starts, and resets the count when the date changes. Failures still count. There are no visitor accounts or stored comparisons. Raw request metadata may still be retained by the hosting platform.

The public endpoint is intentionally anonymous. The request marker and origin check are browser request protections, not authentication. The shared daily ceiling limits provider usage even when an attacker submits direct requests; it cannot guarantee fair distribution between visitors. The cap is a request count, not an exact currency budget.

The build creates the normal local frontend plus a Worker with an explicit embedded frontend asset allowlist. Production static responses cannot expose server source or hosting metadata. The local server also denies the new Worker output directory. Generated migrations and hosting metadata accompany the Worker artifact.

Twenty five deterministic tests cover the original evaluator and local service plus real SQLite execution of the quota statement, spacing, exhaustion, next day reset, input rejection before quota use, failure reservation, fail closed behavior, sanitized errors, and static route isolation. This SQLite adapter validates query semantics, not the Cloudflare deployment environment. Live hosted operation must be checked separately.

A feature detected WebMCP prepare_comparison tool fills the visible form without submitting or calling OpenAI. It validates input and refuses changes during a comparison. Native WebMCP validation is unavailable unless the visiting browser supports that proposed interface; this is not a requirement for ordinary browser use.
