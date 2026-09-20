# Local setup

[Back to the README](../README.md)

Use this guide to run Twofold on your own computer with your own OpenAI API key. If you only want to compare answers, use the [public website](https://twofold.alx21.chatgpt.site).

## Before you start

Install [Node.js 22.12 or newer](https://nodejs.org/en/download), including npm. Git is needed for cloning and Git based updates; it is not needed for a ZIP download.

Check your terminal can find the tools:

```sh
node --version
npm --version
git --version
```

Create a project API key in the [OpenAI API dashboard](https://platform.openai.com/api-keys). Your project needs access to the configured model and available API billing or credits. API usage is separate from a ChatGPT subscription. Do not send your key to another person or put it in GitHub.

## Install from Git

```sh
git clone https://github.com/agammann/twofold.git
cd twofold
npm ci
npm run setup
npm run build
npm start
```

During setup, paste your key into the terminal's hidden prompt and press Enter. No characters appear while you enter it. Setup creates `.env.local` and restricts its file permissions. On Windows, the permitted principals are your user, SYSTEM, and Administrators; on macOS/Linux, the file is restricted to your user.

Wait for `Twofold is ready at http://127.0.0.1:3210`, then open that address in your browser. Keep the terminal open while using Twofold. **Ctrl+C** stops the server.

The local app does not need a Sites account, a Cloudflare account, or a hosted database. The build creates both frontend and hosted artifacts, but `npm start` runs only the local Node server. Building or starting a clone does not deploy to the public site.

## Install from a ZIP or use a launcher

On the [repository page](https://github.com/agammann/twofold), select **Code → Download ZIP**, then extract it completely. Open the extracted folder containing `package.json`. Do not run from inside the ZIP viewer.

After Node.js and npm are installed:

| Platform | Start command |
| :--- | :--- |
| Windows | Double click `start.cmd`, or run `start.cmd` in Command Prompt |
| Windows PowerShell | Run `.\start.cmd` from the project folder |
| macOS or Linux | Run `sh start.sh` from the project folder |

The launchers install dependencies if `node_modules` is missing, run setup if `.env.local` is missing, build, and start the app. They do not open a browser automatically. Use the address printed by the server; if you changed `PORT`, use that port even if the launcher's introductory message still shows 3210.

If `.env.local` exists but is empty or contains an invalid key, run `npm run setup` yourself. After updating a download, run `npm ci` yourself to refresh existing dependencies.

## Use and restart

Select **Load example**, then **Compare answers** to try the full workflow. Loading the example is free; submitting it calls OpenAI and incurs API usage. **Check web sources** adds a research step and may add search charges.

For future sessions, open a terminal in the project folder and run:

```sh
npm start
```

Run `npm run build` first if you changed source files or updated the project. Refresh the browser after restarting the server so it receives a fresh local request token. Copy any inputs you want to keep before refreshing; the app has no saved history.

## Change the key or settings

To replace a key, stop the server and run:

```sh
npm run setup
```

Answer `y` when asked whether to replace the existing key, enter the new key privately, and restart with `npm start`.

Optional local settings can be added to the same ignored `.env.local` file. Keep the existing `OPENAI_API_KEY` line; do not replace the file with just these settings:

```dotenv
OPENAI_MODEL=gpt-5.4-mini
PORT=3210
```

Restart the server after changing settings. The default model uses medium reasoning. Any replacement model must support the Responses API, structured outputs, and medium reasoning; optional web research also needs web search support and project access. The public site's model is configured separately and does not change when you edit your local file.

The provider endpoint is fixed to the official OpenAI API. The local server binds to `127.0.0.1`; do not expose it through a public tunnel or reverse proxy.

## Update a Git checkout

Stop the server first. If you have edited tracked files, commit or safely preserve your changes before updating. The following command stops rather than merging divergent branches:

```sh
git pull --ff-only
npm ci
npm run build
npm start
```

The ignored `.env.local` file remains local. For ZIP installations, extract the new download into a separate folder, install dependencies, and run setup there; do not overwrite the old folder and assume its dependencies are current.

## Troubleshooting

| Symptom | What to do |
| :--- | :--- |
| `node` or `npm` is not found | Install Node.js with npm, reopen your terminal, and check their versions. |
| PowerShell blocks `npm.ps1` | Use `npm.cmd` in place of `npm`, or use Command Prompt. You do not need to weaken PowerShell policy. |
| `package.json` cannot be found | Change into the extracted or cloned project folder before running commands. |
| Setup requests an interactive terminal | Run `npm run setup` in a normal terminal. Do not pipe the key into it. |
| Windows file permissions could not be restricted | The new key was not saved. Use a normal local folder that supports Windows permissions, check its Security properties, and retry setup. |
| OpenAI is not configured or rejects the key | Stop the server, run setup, and restart. Never post the key in a bug report. |
| Model access or API billing error | Check your project's model access and API billing, or choose a supported model in `.env.local`. |
| Build output is missing | Run `npm ci`, then `npm run build`, then `npm start`. |
| Port 3210 is already in use | Stop the other copy, or set a different `PORT` in `.env.local` and use the new address printed by the server. |
| The page asks you to refresh | The server's local request token changed. Preserve any inputs, then refresh the page. |
| Local requests are rate limited | Wait a minute. The local service permits two active comparisons and ten accepted requests per minute. |
| A comparison times out | Shorten the answers or turn off web research. Canceling cannot undo provider work already processed. |
| Quote or citation validation fails | Retry. Twofold rejects evidence references that do not match the supplied answer or retrieved sources. |

Questions may contain up to 4,000 characters and each answer up to 12,000. Comparisons have a three minute deadline. For API costs and retention, follow [OpenAI pricing](https://developers.openai.com/api/docs/pricing) and [data controls](https://developers.openai.com/api/docs/guides/your-data).
