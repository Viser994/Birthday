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
fi

PORT=3000
if command -v ss >/dev/null 2>&1; then
  while ss -tln 2>/dev/null | grep -q ":${PORT} "; do
    echo "Port ${PORT} is busy, trying next..."
    PORT=$((PORT + 1))
    if [ "$PORT" -gt 3010 ]; then
      echo "ERROR: No free port between 3000-3010"
      exit 1
    fi
  done
fi

echo ""
echo "============================================"
echo "  OPEN THIS IN YOUR BROWSER:"
echo "  http://localhost:${PORT}"
echo "============================================"
echo ""
echo "Keep this terminal open. Press Ctrl+C to stop."
echo ""

npm run dev -- --port "${PORT}"
