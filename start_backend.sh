#!/bin/bash

# ──────────────────────────────────────────────────
# Base2 Science and Media Academy — Backend Startup Script
# ──────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

echo ""
echo "════════════════════════════════════════════"
echo "  Base2 Science and Media Academy — SMS Backend"
echo "════════════════════════════════════════════"

# Step 1: Check if XAMPP MySQL is running
if /opt/lampp/bin/mysql -u root -e "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ XAMPP MySQL is already running"
else
  echo "⚠️  XAMPP MySQL is NOT running."
  echo "   Please open your XAMPP Control Panel and start MySQL."
  echo "   Then run this script again."
  echo ""
  echo "   Or run: sudo /opt/lampp/lampp startmysql"
  echo ""
  exit 1
fi

# Step 2: Create the database if it doesn't exist
echo "🗄️  Ensuring database 'b2ma_sms' exists..."
/opt/lampp/bin/mysql -u root -e "CREATE DATABASE IF NOT EXISTS b2ma_sms;" 2>&1
echo "✅ Database ready"

# Step 3: Run Drizzle migrations
echo ""
echo "📦 Running database migrations..."
cd "$BACKEND_DIR"
npm run db:push -- --accept-data-loss 2>&1
echo "✅ Migrations applied"

# Step 4: Seed the database (first run only — skip if users exist)
USER_COUNT=$(/opt/lampp/bin/mysql -u root b2ma_sms -se "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ]; then
  echo ""
  echo "🌱 Seeding database with demo data..."
  npm run seed
  echo "✅ Database seeded"
else
  echo "ℹ️  Database already has $USER_COUNT users — skipping seed"
fi

# Step 5: Start the Fastify backend
echo ""
echo "🚀 Starting Fastify API server on port 3001..."
npm run dev
