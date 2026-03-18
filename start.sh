#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
#  FlowState Planner — dev launcher
#  Usage: ./start.sh
# ─────────────────────────────────────────────────────────
set -e

cd "$(dirname "$0")"

echo ""
echo "  ☀  FlowState Planner"
echo "  ─────────────────────"
echo ""

# 1. Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "  → Installing dependencies..."
  npm install
  echo ""
fi

# 2. Launch Vite dev server
echo "  → Starting dev server on http://localhost:3000"
echo ""
npx vite --host
