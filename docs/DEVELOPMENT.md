# Development

[Back to the README](../README.md) · [Local setup](SETUP.md)

## Start working

Use Node.js 22.12 or newer and npm. Clone the repository, then run:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3210` on the same computer. You can inspect the interface without an API key; use `npm run setup` and restart the server before making real comparisons. Development intentionally disables hot module replacement: refresh for frontend changes and restart for server changes. Stop a production server before starting development on the same port.

## Project layout

| Path | Purpose |
| :--- | :--- |
| `src/` | React interface and styles |
| `shared/` | Input/output schemas, display labels, and Markdown export |
| `server/evaluate.mjs` | Shared OpenAI evaluation and evidence validation |
| `server/app.mjs`, `server/index.mjs` | Local Express application and startup |
| `server/hosted.mjs`, `server/worker.mjs` | Public Sites request handling and Worker entrypoint |
| `db/`, `drizzle/`, `drizzle.config.ts` | Hosted usage schema and generated migration history |
| `scripts/` | Credential setup, builds, release checks, and live evaluations |
| `test/` | Deterministic tests and controlled provider fixtures |
| `evaluations/` | Fixed synthetic live cases and scoring |
| `docs/` | User guides, recorded evidence, and design assets |
| `.openai/hosting.json` | Published Site identity and logical storage bindings; no secret values |
| `.github/workflows/verify.yml` | Windows and Ubuntu verification |

Keep generated dependencies, `dist/`, local evaluation output, and `.env.local` out of Git. The screenshots, recorded report, and compact reliability summaries in `docs/` are intentional historical evidence, not current runtime outputs. Preserve generated migration names and metadata rather than renaming deployed migrations for appearance.

## Commands

Run commands from the repository root.

| Command | Purpose | Calls OpenAI? |
| :--- | :--- | :--- |
| `npm ci` | Install the locked dependencies, including build tools | No |
| `npm run setup` | Save your own API key through a hidden terminal prompt | No |
| `npm run dev` | Start the local development server | Only when a comparison is submitted |
| `npm run build` | Build the frontend and Sites Worker artifacts | No |
| `npm start` | Start the local production server from built output | Only when a comparison is submitted |
| `npm test` | Run deterministic tests, including SQLite quota checks | No |
| `npm run check:release` | Scan tracked staged blobs, working files, and build output for secret material | No |
| `npm run check:release -- --http` | Also probe the running local production server for private file exposure | No |
| `npm run test:live` | Run the arithmetic provider smoke check | Yes, paid |
| `npm run test:live -- --web` | Run arithmetic and web research smoke checks | Yes, paid |
| `npm run eval:live` | Run twelve synthetic cases in both answer orders | Yes, 24 paid evaluation requests |
| `npm run eval:live -- --case identical-wrong` | Run one selected case in both orders | Yes, two paid evaluation requests |

Live scripts read your ignored `.env.local`. The evaluation suite saves complete generated reports under ignored `evaluation-results/`; archive `latest.json` elsewhere within that ignored folder before another run if you want to keep it. A run can fail because a verdict is incorrect, a bare answer receives invented reasoning, a provider request fails, or mapped verdicts vary between answer orders. See [reliability evidence](RELIABILITY.md) for the limits of the scorer.

## Before publishing a change

```sh
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

Review your diff and stage only the intended files. Then run:

```sh
npm run check:release
```

The release gate reads the Git index as well as working copies, so staging must happen before this check. It also needs a completed build. A ZIP download without Git metadata is fine for running the app, but release checks require a Git checkout.

For local HTTP exposure checks, run `npm start` in one terminal, then `npm run check:release -- --http` in a second terminal in the same project. The probe targets the configured local port, not the public Site.

CI runs the deterministic tests, build, release check, and production dependency audit on Windows and Ubuntu. It receives no API key. macOS is supported by the local setup flow but is not part of that CI matrix.

## Contributions and bug reports

Use a focused branch and pull request for a proposed change. Describe the problem, what changes for users, and the checks you ran. For an evaluator change, establish expected results before running the live corpus and retain failures as well as successes. Do not report a small regression suite as a general accuracy benchmark.

For a bug report, include the operating system, Node version, exact steps, and a redacted error message. Use synthetic question and answer text when sharing a reproduction. Never include `.env.local`, API keys, billing details, private comparison inputs, or unreviewed logs. Do not disclose an active credential in a public issue.

No open source license has been selected. See the [README license note](../README.md#license) before redistributing code or adding third party material.

## Hosting changes

Local setup and builds do not publish a Site. The tracked hosting manifest belongs to the existing Twofold deployment. Do not reuse its project ID when registering a separate deployment for a fork. See [hosting ownership and workflow](HOSTING.md) before changing the hosted application, database schema, or usage limit.
