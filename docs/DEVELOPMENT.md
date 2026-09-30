# Development

Run `npm ci`, `npm run dev`, `npm test`, and `npm run build`. The browser evaluator is `src/lib/compare.mjs`; shared schema and exact-quote checks are in `shared/`. The production Worker is `server/hosted.mjs`. Historical Node provider evaluation fixtures remain for regression coverage, but the shipped website and local HTTP server never call that adapter. Paid live-check scripts are legacy tools and are not required or invoked for this edition.
