# Privacy

Device mode keeps comparison inputs and generation in the browser worker. Public model hosts supply executable SDK/runtime assets and weights. Optional source imports send only the supplied URL to this server, which retrieves the page.

Hosted mode is an explicit choice. The visitor supplies an OpenAI API key, then submits a comparison. The key, question, and answers pass through this server; the question, answers, and any retrieved source text go to the fixed OpenAI API endpoint. Author labels stay in the tab. The key is never forwarded to source websites, put in prompts, or included in reports. The app does not persist or log keys or comparison content, and does not put keys in browser storage. Clear key, refresh, or switching to device mode removes the key from app state.

Hosted requests disable response storage with `store: false`; [OpenAI data policies](https://developers.openai.com/api/docs/guides/your-data) still apply. This is not a zero-retention guarantee. Hosting, model hosts, and imported pages may retain ordinary request metadata.

Exports contain the supplied question, answers, and report. The app keeps no comparison history. Hosted usage is billed to the visitor's API account; no operator key or automatic paid fallback is used.
