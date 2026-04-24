#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Base 2 Media Academy — MySQL Database Backup Script
# Usage:   bash backup_db.sh
# Cron:    0 2 * * * /path/to/backup_db.sh   (runs daily at 2 AM)
# ─────────────────────────────────────────────────────────────────

# ── Config ───────────────────────────────────────────────────────
DB_NAME="${DB_NAME:-base2media_sms}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_DIR="$(dirname "$0")/backups"
RETAIN_DAYS=30

# ── Setup ─────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "════════════════════════════════════════════"
echo "  Base 2 Media Academy — DB Backup"
echo "  $(date)"
echo "════════════════════════════════════════════"

# ── Dump & compress ───────────────────────────────────────────────
if [ -n "$DB_PASS" ]; then
  mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-table \
    "$DB_NAME" | gzip > "$FILENAME"
else
  mysqldump -h "$DB_HOST" -u "$DB_USER" \
    --single-transaction \
    --routines \
    --triggers \
    --add-drop-table \
    "$DB_NAME" | gzip > "$FILENAME"
fi

if [ $? -eq 0 ]; then
  SIZE=$(du -sh "$FILENAME" | cut -f1)
  echo "✅ Backup created: $FILENAME ($SIZE)"
else
  echo "❌ Backup FAILED! Check MySQL credentials in .env"
  exit 1
fi

# ── Remove old backups ────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -mtime +${RETAIN_DAYS} -print -delete | wc -l)
echo "🗑  Deleted $DELETED old backup(s) older than $RETAIN_DAYS days"

# ── List remaining ────────────────────────────────────────────────
echo ""
echo "📁 Current backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  (none)"
echo "════════════════════════════════════════════"
