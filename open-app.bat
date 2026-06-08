@echo off
setlocal

cd /d "%~dp0"

set "NODE_HOME=%~dp0.tools\nodejs\node-v24.16.0-win-x64"
if exist "%NODE_HOME%\node.exe" (
  set "PATH=%NODE_HOME%;%PATH%"
)

set "PLAYWRIGHT_BROWSERS_PATH=%~dp0.tools\ms-playwright"
set "APP_URL=http://127.0.0.1:5173"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please check .tools\nodejs or Windows PATH.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please check .tools\nodejs or Windows PATH.
  pause
  exit /b 1
)

echo Project: %CD%
echo Node:
node -v
echo npm:
call npm -v
echo Playwright browsers: %PLAYWRIGHT_BROWSERS_PATH%

if /I "%~1"=="--check" (
  echo Check completed.
  exit /b 0
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -Uri '%APP_URL%' -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  echo App already appears to be running at %APP_URL%.
  start "" "%APP_URL%"
  pause
  exit /b 0
)

echo Starting development server at %APP_URL% ...
start "" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process '%APP_URL%'"
call npm run dev -- --host 127.0.0.1 --port 5173 --strictPort

echo.
echo Development server stopped.
pause
