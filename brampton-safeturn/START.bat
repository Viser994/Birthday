@echo off
cd /d "%~dp0"
title Brampton SafeTurn

echo.
echo  ============================================
echo    Brampton SafeTurn
echo  ============================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo  [ERROR] Node.js is NOT installed.
  echo.
  echo  1. Go to https://nodejs.org
  echo  2. Download the LTS version
  echo  3. Install it, then restart this file
  echo.
  pause
  exit /b 1
)

echo  Node: 
node -v
echo.

if not exist node_modules (
  echo  Installing dependencies... this may take 1-2 minutes
  echo.
  call npm install
  if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] npm install failed. Copy the error above and ask for help.
    pause
    exit /b 1
  )
)

if not exist .env.local (
  copy .env.example .env.local >nul
)

echo.
echo  ============================================
echo    Server starting...
echo    When you see "Ready", open your browser:
echo.
echo       http://localhost:3000
echo.
echo    KEEP THIS WINDOW OPEN while using the app.
echo    Press Ctrl+C to stop the server.
echo  ============================================
echo.

call npm run dev

echo.
echo  Server stopped.
pause
