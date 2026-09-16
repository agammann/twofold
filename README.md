# Twofold

**Two answers. A clearer picture.**

Twofold compares answers from two people or bots to the same question. Paste the question and both answers, then examine the reasoning, disputed claims, evidence, and a verdict that explains what holds up.

The app runs on your computer. Evaluations use your own OpenAI API key. There is no hosted comparison service, account system, or shared API key.

![Twofold local application](docs/twofold-desktop.png)

## Run locally

Install [Node.js 22.12 or newer](https://nodejs.org/en/download) and [Git](https://git-scm.com/downloads), then run:

```sh
git clone https://github.com/agammann/twofold.git
cd twofold
npm ci
npm run setup
npm run build
npm start
```

Open **http://127.0.0.1:3210** in your browser.

`npm run setup` asks for your own project API key in a hidden terminal prompt and writes `.env.local`, which Git ignores. Create a key in your [OpenAI API project](https://platform.openai.com/api-keys). API billing is separate from a ChatGPT subscription. Setup restricts the file to your user on macOS/Linux; on Windows it allows your user, SYSTEM, and Administrators and disables inherited access before writing the key.

On Windows, you can also double click **start.cmd** after downloading or cloning the repository. On macOS/Linux, run **sh start.sh**. These launchers install dependencies when needed, run setup when the configuration file is missing, build, and start the local server.

Use **Load example** for a percentage comparison. It fills in the inputs only. Press **Compare answers** to run a real evaluation; example results are never precomputed or presented as live output.

## What the comparison includes

* A verdict: A, B, both, neither, depends on assumptions, or insufficient evidence.
* Each answer's stated reasoning, with exact excerpts from the supplied text.
* Clearly marked inferred assumptions where reasoning was not explicitly supplied.
* Strengths, weaknesses, agreements, and decisive differences.
* Claim assessments that distinguish calculations, retrieved evidence, supplied text, and model judgments.
* Optional web research with clickable sources tied to individual claims.
* A complete improved answer and concrete limitations.
* A Markdown export containing the original inputs and the comparison.

Twofold cannot see a person or bot's private thought processes. It evaluates the explanation actually supplied. One evaluator's judgment can be wrong; qualitative confidence is not a calibrated probability, and a citation's existence does not prove it supports a claim. Critical decisions still require checking the evidence yourself.

The evaluator can leave reasoning, differences, claims, and limitations empty when the supplied answers do not justify those sections. The interface and export explain what was not identified. Identical answer text cannot produce a preferred author or content differences; identical answers can still both be wrong. When valid recommendations favor different options and the deciding priority is missing, the verdict should be depends. An explicit priority resolves that tradeoff. Both applies when both answers correctly answer the question under the same supplied conditions.

## Privacy and API key protection

The OpenAI key remains in the local Node server. It is never sent to the browser, included in a report, or intentionally logged. The frontend calls only its local server. The app has no database, analytics, browser storage, or saved history; refreshing clears the current comparison.

When you compare, the question and answer text go to OpenAI. Optional author names stay local and are omitted from provider requests. Web checking may send relevant queries through OpenAI's search tools to search providers. Requests use `store: false`; this does not override [OpenAI's data retention policies](https://developers.openai.com/api/docs/guides/your-data). Exported reports contain your supplied inputs, so share them deliberately.

The server binds to `127.0.0.1`, validates browser origins and Host headers, and requires a per process request token. It is designed for a trusted personal computer. Other programs on that same computer can access localhost; this is not authentication between mutually untrusted local users. Do not expose the server through a tunnel or reverse proxy without adding appropriate authentication and deployment controls.

Read [privacy and security details](docs/PRIVACY.md) and [verification evidence](docs/VERIFICATION.md).

## Configuration

Optional settings in your private `.env.local` file:

```dotenv
OPENAI_MODEL=gpt-5.4-mini
PORT=3210
```

The default evaluation uses GPT 5.4 Mini with medium reasoning effort. An alternative model must support the Responses API, structured outputs, and medium reasoning effort; web checking also requires the web search tool. Model access depends on your OpenAI project. The provider endpoint is fixed to the official OpenAI API and cannot be changed through browser input.

Limits: question up to 4,000 characters; each answer up to 12,000; two active comparisons; ten accepted requests per minute; three minutes per comparison; up to three web tool calls. A normal comparison uses one model request, or two when web checking is enabled. Token usage appears in the report. API charges and search charges depend on your [OpenAI pricing](https://developers.openai.com/api/docs/pricing); canceling cannot undo work already processed by the provider.

## Development and checks

```sh
npm ci
npm run dev
npm test
npm run build
npm run check:release
```

Development serves the app at the same local address. Reload after frontend edits; the local Vite middleware intentionally disables HMR. Restart after server edits.

`check:release` scans the exact staged Git blobs, working copies, and production bundle for key material without printing matches. Stage your intended release first. With the production server running, add HTTP exposure probes:

```sh
npm run check:release -- --http
```

Automated tests use controlled provider doubles and never spend API credits. Live smoke tests use your own key and incur API charges:

```sh
npm run test:live
npm run test:live -- --web
```

For a broader reliability check with fixed synthetic inputs:

```sh
npm run eval:live
npm run eval:live -- --case identical-wrong
```

The full suite makes 22 paid API requests across eleven cases, evaluating each in both answer orders with web research off. It checks expected verdicts, absent reasoning for bare conclusions, and verdict consistency after mapping reversed labels back. The two identical answer cases test repeat consistency. Generated reports stay in the ignored `evaluation-results/` directory. A successful suite is a small regression check, not proof of general accuracy or freedom from bias. See the [reliability evidence](docs/RELIABILITY.md) for the measured run and its limits.

[GitHub Actions](https://github.com/agammann/twofold/actions/workflows/verify.yml) runs tests, build, release secret checks, and a production dependency audit on Windows and Ubuntu. No API credentials are required or supplied to CI.

## How it is built

React and Vite provide the interface. Express serves the local app and mediates provider access. OpenAI Responses supplies optional research followed by a structured evaluation. Zod validates input and output; quote options are constrained to actual source excerpts, claim attribution is checked, and citation IDs must belong to the provider's retrieved source set. Source pages are not fetched by the local server.

Author names are omitted to reduce reputation bias. The same evaluator still sees A and B in order; this does not establish order independence or eliminate model bias. Web research is an evidence gathering step, not a second independent judge.

See [design references](docs/DESIGN.md) for the traffic ranked sites that informed the interface. Twofold is an independent project and is not affiliated with those sites or answer providers. The name also has unrelated existing uses; no uniqueness claim is made.

## Troubleshooting

| Message | Action |
| :--- | :--- |
| OpenAI is not configured | Run `npm run setup`, then restart. |
| API key rejected | Check the project key, replace it through setup, and restart. |
| Rate or billing limit | Check API billing and project limits; wait before retrying. |
| Model unavailable | Choose a compatible model available to your project. |
| Comparison timed out | Shorten the answers or disable web checking. |
| Port is in use | Set another `PORT` in `.env.local` and open that port. |
| Quote or citation validation failed | Retry the evaluation. Invalid evidence is rejected rather than shown as verified. |

Public source is provided for the requested local workflow. No open source license has been selected for this repository.
