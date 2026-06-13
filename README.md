# ClinicOS AI — Deployment Guide

**Your website:** https://clinicos.aderalabs.com  
**Admin panel:** https://clinicos.aderalabs.com/superadmin/login  
**Support email:** support@clinicos.aderalabs.com

---

## .ENV FILE — CURRENT STATUS

Open `C:\Users\DELL\Documents\ClinicOS\apps\api\.env` and check:

| Line | Status | Notes |
|------|--------|-------|
| `NODE_ENV=production` | ✅ Done | |
| `FRONTEND_URL` / `APP_URL` | ✅ Done | Set to clinicos.aderalabs.com |
| `DATABASE_URL` | 🔧 **Change password** | Must match what you set in cPanel MySQL |
| `JWT_SECRET` | ✅ Done | |
| `SUPERADMIN_EMAIL` | ✅ Done | support@clinicos.aderalabs.com |
| `SUPERADMIN_PASSWORD_HASH` | 🔧 **Set in cPanel terminal** | See Step 5C below |
| `SMTP_HOST` | ✅ Done | mail.aderalabs.com |
| `SMTP_USER` | ✅ Done | support@clinicos.aderalabs.com |
| `SMTP_PASS` | 🔧 **Fill in** | Your cPanel email password |
| `OPENAI_API_KEY` | ✅ Done | |
| `CLOUDINARY_*` | ✅ Done | |
| Stripe / Twilio / ElevenLabs | ✅ Skipped on purpose | Add after launch |

---

## STEP 1 — BUILD ON YOUR COMPUTER

Open **PowerShell** (press Windows key → type `powershell` → Enter).

Type each line and press Enter. Wait for each to finish:

```
cd C:\Users\DELL\Documents\ClinicOS
```

```
npm install
```
*(Wait 3-5 minutes)*

```
cd apps\api
npm run build
npx prisma generate
cd ..\web
npm run build
cd ..\..
```

After this you will have:
- `apps/api/dist/` — compiled backend
- `apps/web/.next/` — compiled frontend

---

## STEP 2 — CREATE DATABASE IN CPANEL

1. Log into cPanel at your **Adera Labs** hosting
   - URL is usually: `https://clinicos.aderalabs.com:2083` or check your hosting welcome email

2. Find **"MySQL Databases"** → click it

3. Create database:
   - Type: `clinicos_db` → click **Create Database** ✓

4. Create user:
   - Username: `clinicos_user`
   - Password: `4mQ6S77xZ3TiGs` ← use this exactly (already in your .env)
   - Click **Create User**

5. Add user to database:
   - User: `clinicos_user` | Database: `clinicos_db`
   - Click **Add** → check **ALL PRIVILEGES** → click **Make Changes**

✅ Database ready.

---

## STEP 3 — CREATE EMAIL ACCOUNT IN CPANEL

1. cPanel → **Email Accounts** → click **Create**
2. Username: `support` | Domain: `clinicos.aderalabs.com`
3. Set a password — write it down
4. Click **Create**

5. Open `apps/api/.env` in Notepad → find `SMTP_PASS=REPLACE_WITH_EMAIL_PASSWORD`
   → replace with the password you just set

✅ Email ready.

---

## STEP 4 — UPLOAD BACKEND

**Zip these files** from `C:\Users\DELL\Documents\ClinicOS\apps\api\`:
- `dist/` folder
- `prisma/` folder
- `package.json`
- `.env`
- `ecosystem.config.js`

Right-click → Send to → Compressed (zipped) folder → name it `clinicos-api.zip`

**In cPanel File Manager:**
1. Go to your **home directory** (the folder that contains `public_html`)
2. Create folder: `clinicos-api`
3. Open `clinicos-api` → Upload → upload `clinicos-api.zip`
4. Right-click zip → **Extract** → then delete the zip

✅ Backend uploaded.

---

## STEP 5 — UPLOAD FRONTEND

**3 separate uploads to `public_html`:**

**Upload 1 — App files:**
- Zip everything INSIDE `apps/web/.next/standalone/`
- Upload to `public_html/` → extract → delete zip

**Upload 2 — Static files:**
- Zip everything INSIDE `apps/web/.next/static/`
- In `public_html`, open or create `.next/static/` folder
- Upload zip there → extract → delete zip

**Upload 3 — Public files:**
- Zip everything INSIDE `apps/web/public/`
- Upload to `public_html/` → extract → delete zip

**Upload 4 — One single file:**
- Upload `apps/web/.env.local` directly to `public_html/`

After uploads, `public_html` must contain:
```
public_html/
├── .htaccess       ← routes /api to backend (critical)
├── .env.local
├── server.js
├── favicon.svg
├── robots.txt
├── .next/static/
└── node_modules/
```

✅ Frontend uploaded.

---

## STEP 6 — SET UP NODE.JS APP AND START SERVER

### Part A — Create the app

1. cPanel → **"Setup Node.js App"** → click **"Create Application"**
2. Fill in:
   - Node.js version: **20**
   - Application mode: **Production**
   - Application root: **clinicos-api**
   - Application URL: **clinicos.aderalabs.com**
   - Startup file: **dist/app.js**
3. Click **Create**

### Part B — Install and set up database

4. Click the **pencil icon** ✏️ next to your app → click **Open Terminal**
5. A black box opens in your browser — click inside it, then run:

```
npm install
```
*(Wait 2-3 minutes)*

```
npx prisma db push
```
*(Creates all database tables — you should see "Your database is now in sync")*

### Part C — Set your super admin password ⚠️ DO NOT SKIP

6. Still in the terminal, run this (choose your own password — example uses `Admin@Clinicos2026`):
```
node -e "require('bcrypt').hash('Admin@Clinicos2026', 12).then(h => console.log(h))"
```
It prints something like: `$2b$12$AbCdEfGhIjKlMnOpQrStUv...`

7. **Copy that entire `$2b$12$...` line**

8. Go to cPanel File Manager → open `clinicos-api` folder → click `.env` → click **Edit**

9. Find: `SUPERADMIN_PASSWORD_HASH=REPLACE_WITH_BCRYPT_HASH`

10. Replace `REPLACE_WITH_BCRYPT_HASH` with the hash you copied

11. Click **Save Changes**

### Part D — Start with PM2

12. Back in the terminal:
```
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
```

13. In the Node.js App panel → click **Restart**

✅ Server running.

---

## STEP 7 — ENABLE SSL (FREE HTTPS)

1. cPanel → **SSL/TLS** or **Let's Encrypt SSL**
2. Find `clinicos.aderalabs.com` → click **Issue** or **Run AutoSSL**
3. Wait 2-3 minutes

Test: open browser → go to `https://clinicos.aderalabs.com/health`
You should see: `{"status":"ok","app":"ClinicOS AI"}`

✅ SSL active.

---

## STEP 8 — TEST EVERYTHING

- [ ] `https://clinicos.aderalabs.com` — landing page loads
- [ ] `https://clinicos.aderalabs.com/health` — shows `{"status":"ok"}`
- [ ] `https://clinicos.aderalabs.com/login` — login form works
- [ ] `https://clinicos.aderalabs.com/book/dr-ahmed-rahman` — booking page loads
- [ ] `https://clinicos.aderalabs.com/superadmin/login`:
  - Email: `support@clinicos.aderalabs.com`
  - Password: whatever you set in Step 6C

---

## YOUR LOGINS (SAVE THIS)

| What | URL | Email | Password |
|------|-----|-------|----------|
| **Your admin panel** | /superadmin/login | support@clinicos.aderalabs.com | what you set in Step 6C |
| **Test doctor** | /login | rahman@test.clinicos.ai | TestPass123! |
| **Test staff** | /login | staff@test.clinicos.ai | TestPass123! |
| **Test booking** | /book/dr-ahmed-rahman | — | — |

---

## TROUBLESHOOTING

**Blank page / server not starting:**
- cPanel → Setup Node.js App → pencil icon → Open Terminal
- Type: `pm2 logs clinicos-api --lines 50`
- Read the red error — it tells you what's wrong

**Cannot connect to database:**
- Check that password in `DATABASE_URL` matches what you set for `clinicos_user`
- Re-run `npx prisma db push`

**Admin login says wrong password:**
- You skipped Step 6C — go back and do it now

**API not working (dashboard empty):**
- Check `.htaccess` was uploaded to `public_html`
- Test: `https://clinicos.aderalabs.com/api/health`

**Email not sending:**
- Check `SMTP_PASS` in `.env` matches your cPanel email password
- Make sure `support@clinicos.aderalabs.com` exists in cPanel Email Accounts

---

## WHAT TO ADD AFTER LAUNCH

| Feature | Sign up at | Time |
|---------|-----------|------|
| WhatsApp + SMS | https://twilio.com (free trial) | 30 min |
| Doctor subscription billing | https://stripe.com (test mode free) | 1 hour |
| AI voice calls | https://elevenlabs.io (free tier) | 20 min |

When ready: add keys to `.env` in File Manager → save → in terminal type `pm2 restart clinicos-api`
