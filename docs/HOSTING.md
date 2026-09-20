# Hosted Twofold

The public application runs on [OpenAI Sites](https://twofold.alx21.chatgpt.site). Visitors can compare answers without installing software or supplying a key. [Local operation](SETUP.md) remains available from the same repository.

## Runtime and limits

The Cloudflare Worker calls the existing evaluator with GPT 5.4 Mini, medium reasoning, no SDK retries, bounded input/output, and an optional bounded web research step. The API key is a private Sites environment secret, never build input or frontend configuration.

A generated Drizzle migration creates a single D1 usage row. One atomic SQL upsert reserves each comparison before provider work, enforces 30 comparisons per UTC day and at least 10 seconds between accepted starts, and resets the count when the date changes. Failures still count. There are no visitor accounts or stored comparisons. Raw request metadata may still be retained by the hosting platform.

The public endpoint is intentionally anonymous. The request marker and origin check are browser request protections, not authentication. The shared daily ceiling limits provider usage even when an attacker submits direct requests; it cannot guarantee fair distribution between visitors. The cap is a request count, not an exact currency budget.

The build creates the normal local frontend plus a Worker with an explicit embedded frontend asset allowlist. Production static responses cannot expose server source or hosting metadata. The local server also denies the new Worker output directory. Generated migrations and hosting metadata accompany the Worker artifact.

## Verification

Twenty five deterministic tests cover the original evaluator and local service plus real SQLite execution of the quota statement, spacing, exhaustion, next day reset, input rejection before quota use, failure reservation, fail closed behavior, sanitized errors, and static route isolation. This SQLite adapter validates query semantics, not the Cloudflare deployment environment. Separate live hosted checks are recorded in [verification evidence](VERIFICATION.md#public-hosting-release-110).

A feature detected WebMCP `prepare_comparison` tool fills the visible form without submitting or calling OpenAI. It validates input and refuses changes during a comparison. The proposed interface requires a supporting browser; ordinary browser use does not depend on it.

## Deployment ownership

The tracked `.openai/hosting.json` identifies this project's existing Twofold Site and declares its logical `DB` binding. It contains no API key. Cloning, building, or starting this repository does not publish a deployment or grant access to that Site.

Maintainers updating this Site must use its existing registration. Anyone deploying a separate fork must register their own Site and replace the manifest's project ID with the returned ID. Do not copy production credentials into a fork or into source control. Configure a private `OPENAI_API_KEY` runtime secret for the intended Site through Sites; a local `.env.local` file is not uploaded or automatically used by the hosted service.

The hosted service fixes its model to GPT 5.4 Mini and its shared quota in `server/hosted.mjs`. Local `OPENAI_MODEL` and `PORT` settings do not change the public service. The local service permits two active evaluations and ten accepted requests per minute; the public service instead enforces the shared daily cap and start spacing described above.

## Maintainer publication checklist

1. Review the intended source changes and run the [development checks](DEVELOPMENT.md#before-publishing-a-change).
2. For database schema changes, run `node node_modules/drizzle-kit/bin.cjs generate`, inspect the generated SQL and metadata, and retain deployed migration history.
3. Build the frontend and Worker with `npm run build`. Required outputs include `dist/server/index.js`, `dist/.openai/hosting.json`, and the generated migrations under `dist/.openai/drizzle/`.
4. Push the exact reviewed source to the Site's configured source repository using its authorized Sites credential. Never place credentials in remote URLs or tracked configuration.
5. Package only the build output through the Sites hosting workflow, save a version tied to the full pushed commit, and deploy that saved version. Preserve the intended audience.
6. Wait for a successful terminal deployment status and record its returned public URL. A registered Site or a saved version alone is not a completed deployment.
7. Keep GitHub's public URL and user instructions aligned with the deployed behavior. GitHub and Sites have separate source histories; equal source trees do not imply equal commit IDs.

Documentation only changes in GitHub do not require deploying an unchanged application. Changes to runtime environment values require a new deployment to take effect. For release scripts and contributor expectations, see the [developer guide](DEVELOPMENT.md).
