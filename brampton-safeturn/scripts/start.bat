@echo off
cd /d "%~dp0.."
title Brampton SafeTurn

echo ============================================
echo   Brampton SafeTurn - Starting dev server
echo ============================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed.
  echo Download from https://nodejs.org ^(v18 or newer^)
  pause
  exit /b 1
)

echo Node version:
node -v
echo.

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if %ERRORLEVEL% NEQ 0 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if not exist .env.local (
  echo Creating .env.local from template...
  copy .env.example .env.local
)

echo.
echo ============================================
echo   OPEN THIS IN YOUR BROWSER:
echo   http://localhost:3000
echo ============================================
echo.
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.

call npm run dev
pause
