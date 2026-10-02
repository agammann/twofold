# Setup

Install Node.js 22.12+ and npm. Run `npm ci`, `npm run build`, and `npm start`. Open `http://127.0.0.1:3210` or `http://localhost:3210` on the same computer. Use `npm run dev` for development.

## Device mode

No provider key or model server is required. The first run downloads model files from public hosts, then WebLLM generates in a dedicated browser worker. The device option uses Qwen 3 4B. Downloads are cached when browser storage permits.

Use HTTPS or localhost and a current browser with WebGPU and compatible graphics hardware. A model choice does not guarantee enough memory. Download speed, inference speed, and report quality vary. Browser models can return incomplete or inconsistent reports; review claims and quotations. Stop a download or generation in the interface; errors preserve the inputs.

## Hosted mode with a visitor key

Select **OpenAI with your key**, use the recommended GPT-5.4 or choose the lower-cost GPT-5.4 mini, and enter your own OpenAI Platform API key. Submitting a comparison sends the question, answers, and any supplied source text through this server to OpenAI. API usage is billed to the visitor's account. Author labels stay local.

The key is held only in tab memory and forwarded to the fixed OpenAI endpoint. Clear it, refresh, or switch back to device mode to remove it. Do not put a key in the question, answers, source URLs, repository, or public build. The running app never reads an operator environment key as a fallback. There is no automatic switch from device mode to paid inference.

Both modes check only the source pages supplied by the visitor. Hosting and model-download bandwidth are separate from API fees. See the [README](../README.md) for privacy, validation, and current limitations.
