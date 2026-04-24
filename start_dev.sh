#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Base 2 Media Academy — Local Dev Startup Script
# Usage: bash start_dev.sh
# ─────────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║     Base 2 Media Academy — Local Dev Start      ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Step 1: Start XAMPP ───────────────────────────────────────────
echo "▶ Starting XAMPP (MySQL + Apache)..."
if command -v /opt/lampp/lampp &> /dev/null; then
  sudo /opt/lampp/lampp start
  sleep 2
  echo "  ✅ XAMPP started"
else
  echo "  ⚠  XAMPP not found at /opt/lampp — skipping (use XAMPP Control Panel)"
fi

# ── Step 2: Copy .env if missing ─────────────────────────────────
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
  echo ""
  echo "▶ Creating backend/.env from .env.example ..."
  cp "$PROJECT_DIR/backend/.env.example" "$PROJECT_DIR/backend/.env"
  echo "  ✅ backend/.env created — edit DB credentials if needed"
fi

# ── Step 3: Install dependencies ─────────────────────────────────
echo ""
echo "▶ Installing frontend dependencies..."
cd "$PROJECT_DIR" && npm install --silent

echo ""
echo "▶ Installing backend dependencies..."
cd "$PROJECT_DIR/backend" && npm install --silent

# ── Step 4: Start backend in background ──────────────────────────
echo ""
echo "▶ Starting backend (Fastify on port 4000)..."
cd "$PROJECT_DIR/backend"
npx ts-node src/server.ts &
BACKEND_PID=$!
sleep 2

if kill -0 $BACKEND_PID 2>/dev/null; then
  echo "  ✅ Backend running on http://localhost:4000  (PID $BACKEND_PID)"
else
  echo "  ⚠  Backend failed to start — check backend logs"
  echo "  Tip: DB not required for frontend-only mode (mock data works)"
fi

# ── Step 5: Start frontend ────────────────────────────────────────
echo ""
echo "▶ Starting frontend (Vite on port 5173)..."
cd "$PROJECT_DIR"
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Frontend →  http://localhost:5173                       ║"
echo "║  Backend  →  http://localhost:4000                       ║"
echo "║  API Health→ http://localhost:4000/health                ║"
echo "║                                                          ║"
echo "║  Demo Logins:                                            ║"
echo "║    Admin:   admin@base2media.ac   / admin123             ║"
echo "║    Staff:   staff@base2media.ac   / staff123             ║"
echo "║    Student: student@base2media.ac / student123           ║"
echo "║    Parent:  parent@base2media.ac  / parent123            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
npm run dev
