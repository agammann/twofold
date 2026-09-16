import { build as viteBuild } from 'vite';
import { build } from 'esbuild';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, cpSync } from 'node:fs';
import path from 'node:path';

await viteBuild();
// Embed only the explicit frontend output. No filesystem or secret access at runtime.
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const assets = {};
for (const file of ['index.html', 'favicon.svg', ...readdirSync('dist/assets').map(f => `assets/${f}`)]) {
  const type = types[path.extname(file)]; if (!type) throw Error(`Unexpected frontend asset: ${file}`);
  assets[file === 'index.html' ? '/' : `/${file}`] = { type, data: readFileSync(`dist/${file}`).toString('base64') };
}
await build({ entryPoints: ['server/worker.mjs'], outfile: 'dist/server/index.js', bundle: true, format: 'esm', platform: 'browser', target: 'es2022', minify: true,
  plugins: [{ name: 'frontend-assets', setup(b) {
    b.onResolve({ filter: /^twofold:assets$/ }, () => ({ path: 'assets', namespace: 'twofold' }));
    b.onLoad({ filter: /.*/, namespace: 'twofold' }, () => ({ contents: `export default ${JSON.stringify(assets)}`, loader: 'js' }));
  } }],
});
mkdirSync('dist/.openai', { recursive: true });
writeFileSync('dist/.openai/hosting.json', readFileSync('.openai/hosting.json'));
cpSync('drizzle', 'dist/.openai/drizzle', { recursive: true });
