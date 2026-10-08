@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 from https://nodejs.org first.
  pause
  exit /b 1
)
if not exist node_modules (
  call npm ci
  if errorlevel 1 goto failure
)
call npm run build
if errorlevel 1 goto failure
echo Open the local address printed below after the server starts.
call npm start
exit /b %errorlevel%
:failure
echo Setup or build failed. See the message above.
pause
exit /b 1
