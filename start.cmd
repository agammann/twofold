@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.12 or newer from https://nodejs.org first.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 goto failure
)
if not exist .env.local (
  call npm run setup
  if errorlevel 1 goto failure
)
call npm run build
if errorlevel 1 goto failure
echo Open http://127.0.0.1:3210 in your browser after the server starts.
call npm start
exit /b %errorlevel%
:failure
echo Setup or build failed. See the message above.
pause
exit /b 1
