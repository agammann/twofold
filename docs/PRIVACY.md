# Privacy and security

Twofold is available as a public OpenAI Sites application and as a local app. Neither source nor frontend assets include a project key. Local users configure their own OpenAI credentials; public visitors use the hosted comparison service without supplying a key.

## Data flow

1. The browser holds your question, two answers, optional labels, and current report in memory.
2. Comparing sends question and answer text to the hosted or local server. Optional author labels remain in the browser. The server sends only question and answer text to OpenAI, together with evaluation instructions and optional retrieved research.
3. Optional web checking uses OpenAI's web search tool. Relevant search queries may reach search providers.
4. Results return to the browser. Source links open only when you choose to follow them. The local server does not fetch arbitrary URLs from pasted answers.
5. Export downloads a Markdown file with inputs, labels, the report, sources, and evaluator metadata. Twofold does not upload this file.

The app stores no comparison database or local browser history. The hosted service stores a single shared usage row containing the UTC date, reserved comparison count, and last request time. It stores no IP addresses, visitor identifiers, questions, answers, or reports in that row. Hosting infrastructure may retain request metadata. Requests use `store: false`, which does not remove the provider's independent retention and abuse monitoring policies. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

## Credential handling

The hosted Worker reads the key from a private Sites runtime secret. The local Node server reads it from `.env.local` or the process environment. The official API endpoint is fixed in server code. Configuration is never returned by the status endpoint beyond the configured boolean and model name. The other token in the status response is a random local request token, not your OpenAI key.

Setup takes hidden terminal input, checks the destination is a regular file, establishes restrictive permissions before writing, and fails before the new secret write if permissions cannot be established. On Windows it replaces the file access rules with current user, SYSTEM, and Administrators. On POSIX it uses mode 0600. Administrators and software running as your account still have local authority; these controls do not protect an already compromised computer.

The environment file is ignored by Git. The release check scans exact staged contents and working copies, plus built frontend files. It reports filenames only, never matching key values. This check is defense in depth, not a guarantee against all possible secret encodings or intentional disclosure. Do not paste a key into a question, answer, issue, screenshot, or report.

## Local API controls

The server binds only to 127.0.0.1 and allows localhost Host values. Browser requests from another origin or marked cross site are rejected. Comparisons require an unpredictable token fetched from the local status endpoint. API responses disable caching. Production static pages receive a Content Security Policy and serve only the dist directory with dotfiles denied.

Input size, request rate, concurrent evaluations, tool calls, output tokens, and duration have explicit limits. Canceling aborts outstanding provider requests where possible; it cannot reverse already incurred processing costs.

These controls target accidental network exposure and hostile websites. They do not provide separation among local users or programs. The separate Sites Worker handles public hosting. Tunnels and reverse proxies around the local server remain unsupported.

## Public API controls

Public comparisons require a same origin JSON request and use the same bounded evaluator as the local app. The public request marker is not an authentication secret. Anyone can use the public endpoint; origin checks do not stop direct HTTP clients. A durable atomic quota limits total accepted comparisons to 30 per UTC day and one new comparison every 10 seconds. Reservations are not refunded on errors or cancellation. If the quota database is unavailable, comparisons fail closed. This bounds model calls but does not prevent someone exhausting the public allowance. Only explicit frontend assets are served; Worker code, database metadata, and secret files are not routes.

## Evidence boundaries

The evaluator has no local shell, filesystem, repository, or credential tools. Responses are rendered as React text, and exports escape Markdown and HTML. URLs are limited to HTTP and HTTPS and may not contain credentials. Schema restrictions check exact excerpts and source membership.

These are mechanical integrity checks. They do not prove a source is trustworthy, that its text supports a model's interpretation, that an answer is correct, or that prompt injection cannot bias an evaluation. Confidence and correctness remain model judgments.
