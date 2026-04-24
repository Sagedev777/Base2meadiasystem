# 🚀 Base 2 Media Academy — cPanel Deployment Guide

> Complete step-by-step instructions to deploy the system to your cPanel server.

---

## Prerequisites

- cPanel hosting account with **Node.js App** support
- MySQL database created in cPanel phpMyAdmin
- SSL certificate (AutoSSL enabled in cPanel)
- SSH access (optional but recommended)

---

## Step 1 — Prepare Environment Variables

1. Copy `backend/.env.example` → `backend/.env`
2. Fill in your **cPanel MySQL** credentials:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=cpanelusername_dbuser
DB_PASSWORD=your_db_password
DB_NAME=cpanelusername_base2media

JWT_SECRET=generate_a_long_random_string_here
REFRESH_TOKEN_EXPIRES_DAYS=7

SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password

APP_URL=https://yourdomain.com
NODE_ENV=production
PORT=4000
```

---

## Step 2 — Run Database Migrations

```bash
# On your local machine connected to cPanel MySQL:
cd backend
npm run db:push
# Then seed the initial admin account:
npx ts-node src/db/seed.ts
```

---

## Step 3 — Build the React Frontend

```bash
# From the project root:
npm run build
# Output is in: dist/
```

Copy everything inside `dist/` to your cPanel `public_html/` directory.

**Also copy** `public/.htaccess` → `public_html/.htaccess`

---

## Step 4 — Deploy the Backend

1. In cPanel → **Node.js App** → Create Application:
   - **Node version:** 18.x or 20.x
   - **Application mode:** Production
   - **Application root:** `backend/` (relative to your home dir)
   - **Application URL:** `yourdomain.com` (or a subdomain)
   - **Application startup file:** `dist/server.js`
   - **Port:** 4000

2. Set environment variables in the cPanel Node.js app panel  
   *(copy all values from your `.env`)*

3. In cPanel → **Node.js App** → click **Run NPM Install**

4. Build the backend:
   ```bash
   cd backend && npm run build
   ```

5. Click **Restart** in the cPanel Node.js app panel.

---

## Step 5 — Configure Apache Proxy

The `public/.htaccess` file is already configured to proxy `/api/*` to Node.js on port 4000.

If the file isn't working, enable **mod_proxy** via cPanel support or add this to `.htaccess`:

```apache
RewriteCond %{REQUEST_URI} ^/api [NC]
RewriteRule ^(.*)$ http://127.0.0.1:4000/$1 [P,L]
```

---

## Step 6 — Enable SSL

1. cPanel → **SSL/TLS** → **Let's Encrypt SSL (AutoSSL)**
2. Click **Issue** for your domain
3. Wait ~2 minutes for the certificate to activate
4. Test: `https://yourdomain.com` should load without browser warnings

---

## Step 7 — Set Up Daily DB Backup

In cPanel → **Cron Jobs**, add:

```
0 2 * * * /home/yourusername/base2media/backup_db.sh >> /home/yourusername/base2media/backups/cron.log 2>&1
```

This runs the backup daily at **2:00 AM**.

---

## Step 8 — Verify the Deployment

| Check | URL |
|---|---|
| Frontend loads | `https://yourdomain.com` |
| API health | `https://yourdomain.com/api/health` |
| Login works | `https://yourdomain.com/login` |
| Admin dashboard | `https://yourdomain.com/admin` |

---

## Default Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@base2media.ac | admin123 |
| Staff | staff@base2media.ac | staff123 |
| Student | student@base2media.ac | student123 |
| Parent | parent@base2media.ac | parent123 |

> ⚠️ **Change all passwords immediately after first login in production!**

---

## Troubleshooting

| Problem | Fix |
|---|---|
| API returns 502 | Node.js app not running → Restart in cPanel |
| DB connection error | Check `.env` DB credentials match cPanel MySQL |
| Emails not sending | Verify SMTP credentials in `.env` + check spam folder |
| SSL not working | Wait 5 min after AutoSSL or check cPanel SSL status |
| White page on load | Check `dist/` was uploaded to `public_html/` correctly |
