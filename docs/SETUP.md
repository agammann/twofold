# Setup

Install Node.js 22.12+ and npm. Run `npm ci`, `npm run build`, `npm start`. Open http://127.0.0.1:3210 on the same computer. Use `npm run dev` for development. No provider key, credits, setup prompt or model server is required. The first run downloads model files from public hosts. Text generation runs in a dedicated browser worker using WebLLM; prompts are not sent to a hosted model. The default is Qwen 3 1.7B, with larger Qwen 3 4B and smaller Llama 3.2 1B choices. Model downloads are cached when browser storage permits.

Use HTTPS (or localhost) and a current browser with WebGPU and compatible graphics hardware. A model choice does not guarantee that every device has enough memory. Download speed, inference speed and answer quality depend on the device and model. Stop a download or generation from the interface; errors preserve existing inputs. There is no paid model fallback. Hosting and model-download bandwidth remain separate from AI API fees.
