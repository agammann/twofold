# Privacy and local security

Twofold runs a local web interface and a local Node server. Public GitHub source does not include a hosted API or a project key. Each user configures their own OpenAI credentials.

## Data flow

1. The browser holds your question, two answers, optional labels, and current report in memory.
2. Comparing sends these inputs to the local server. The server sends only question and answer text to OpenAI, together with evaluation instructions and optional retrieved research.
3. Optional web checking uses OpenAI's web search tool. Relevant search queries may reach search providers.
4. Results return to the browser. Source links open only when you choose to follow them. The local server does not fetch arbitrary URLs from pasted answers.
5. Export downloads a Markdown file with inputs, labels, the report, sources, and evaluator metadata. Twofold does not upload this file.

The app stores no comparison database or local browser history. Requests use `store: false`, which does not remove the provider's independent retention and abuse monitoring policies. See [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

## Credential handling

The key is read only by Node from `.env.local` or the process environment. The official API endpoint is fixed in server code. Configuration is never returned by the status endpoint beyond the configured boolean and model name. The other token in the status response is a random local request token, not your OpenAI key.

Setup takes hidden terminal input, checks the destination is a regular file, establishes restrictive permissions before writing, and fails before the new secret write if permissions cannot be established. On Windows it replaces the file access rules with current user, SYSTEM, and Administrators. On POSIX it uses mode 0600. Administrators and software running as your account still have local authority; these controls do not protect an already compromised computer.

The environment file is ignored by Git. The release check scans exact staged contents and working copies, plus built frontend files. It reports filenames only, never matching key values. This check is defense in depth, not a guarantee against all possible secret encodings or intentional disclosure. Do not paste a key into a question, answer, issue, screenshot, or report.

## Local API controls

The server binds only to 127.0.0.1 and allows localhost Host values. Browser requests from another origin or marked cross site are rejected. Comparisons require an unpredictable token fetched from the local status endpoint. API responses disable caching. Production static pages receive a Content Security Policy and serve only the dist directory with dotfiles denied.

Input size, request rate, concurrent evaluations, tool calls, output tokens, and duration have explicit limits. Canceling aborts outstanding provider requests where possible; it cannot reverse already incurred processing costs.

These controls target accidental network exposure and hostile websites. They do not provide separation among local users or programs. Public hosting, tunnels, reverse proxies, multiuser authentication, and accounts are outside the supported deployment.

## Evidence boundaries

The evaluator has no local shell, filesystem, repository, or credential tools. Responses are rendered as React text, and exports escape Markdown and HTML. URLs are limited to HTTP and HTTPS and may not contain credentials. Schema restrictions check exact excerpts and source membership.

These are mechanical integrity checks. They do not prove a source is trustworthy, that its text supports a model's interpretation, that an answer is correct, or that prompt injection cannot bias an evaluation. Confidence and correctness remain model judgments.
