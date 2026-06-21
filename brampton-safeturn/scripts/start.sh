#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "============================================"
echo "  Brampton SafeTurn — Starting dev server"
echo "============================================"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed."
  echo "Install from https://nodejs.org (v18 or newer)"
  exit 1
fi

echo "Node: $(node -v)"
echo "npm:  $(npm -v)"
echo ""

if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f .env.local ]; then
  echo "Creating .env.local from template..."
  cp .env.example .env.local
  echo "  -> Edit .env.local to add your API keys (optional for demo mode)"
fi

echo ""
echo "Starting server at http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

npm run dev
