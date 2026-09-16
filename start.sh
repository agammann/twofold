#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo 'Install Node.js 22.12 or newer from https://nodejs.org first.'
  exit 1
fi
if [ ! -d node_modules ]; then npm ci; fi
if [ ! -f .env.local ]; then npm run setup; fi
npm run build
echo 'Open http://127.0.0.1:3210 in your browser after the server starts.'
exec npm start
