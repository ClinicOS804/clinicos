# ClinicOS AI — Upload & Go Live Guide

**Your website:** https://clinicos.workee.online  
**Admin panel:** https://clinicos.workee.online/superadmin/login  
**Support email:** support@clinicos.workee.online

---

## ✅ ALREADY DONE (do not repeat)

- [x] Node.js installed on your computer
- [x] All packages installed (`npm install`)
- [x] API backend built → `apps/api/dist/` folder exists
- [x] Frontend built → `apps/web/.next/` folder exists
- [x] `.env` file filled in (OpenAI, Cloudinary, database, email, JWT)
- [x] `SUPERADMIN_PASSWORD_HASH` is the only thing still needed — done in Step 5 below

---

## STEP 1 — CREATE DATABASE IN CPANEL

1. Open your browser → go to your cPanel login URL  
   (Your hosting company sent this — looks like `https://clinicos.workee.online:2083`)

2. Enter your cPanel username and password

3. Find the **"Databases"** section → click **"MySQL Databases"**

4. Under **"Create New Database"**:
   - Type: `clinicos_db`
   - Click **"Create Database"** button
   - You see a green success message ✓

5. Scroll down to **"MySQL Users"** → **"Add New User"**:
   - Username: `clinicos_user`
   - Password: `4mQ6S77xZ3TiGs` ← use this exact password (it's already in your .env)
   - Click **"Create User"**

6. Scroll down to **"Add User To Database"**:
   - User: `clinicos_user`
   - Database: `clinicos_db`
   - Click **"Add"**
   - On the next screen: check **"ALL PRIVILEGES"** → click **"Make Changes"**

✅ Database is ready.

---

## STEP 2 — CREATE EMAIL ACCOUNT IN CPANEL

1. In cPanel → find **"Email"** section → click **"Email Accounts"**

2. Click **"Create"** button

3. Fill in:
   - Username: `support`
   - Domain: `clinicos.workee.online`
   - Password: `@Nsa_Khan&931` ← use this exact password (it's already in your .env)

4. Click **"Create"** button

✅ Email is ready.

---

## STEP 3 — UPLOAD BACKEND TO CPANEL FILE MANAGER

1. In cPanel → find **"Files"** section → click **"File Manager"**

2. In the left panel, click on your **home folder** — this is the one that CONTAINS `public_html`, not inside it. It usually shows your domain name or username at the top.

3. Click **"New Folder"** in the top toolbar
   - Folder name: `clinicos-api`
   - Click **"Create New Folder"**

4. Double-click to open the `clinicos-api` folder

5. Click **"Upload"** in the top toolbar — a new browser tab opens

6. On your Windows computer, open File Explorer and go to:
   `C:\Users\DELL\Documents\ClinicOS\apps\api\`

7. Drag and drop these into the upload area (one by one or together):
   - The `dist` **folder** ← most important
   - The `prisma` **folder**
   - The `package.json` **file**
   - The `.env` **file** ← contains your API keys
   - The `ecosystem.config.js` **file**

   ⛔ Do NOT upload the `node_modules` or `src` folders

8. Wait for all uploads to show 100% → close this tab

9. Go back to File Manager and verify `clinicos-api` contains:
   ```
   clinicos-api/
   ├── dist/
   ├── prisma/
   ├── .env
   ├── package.json
   └── ecosystem.config.js
   ```

✅ Backend files uploaded.

---

## STEP 4 — UPLOAD FRONTEND TO CPANEL FILE MANAGER

1. In File Manager, navigate to **`public_html`**
   (click `public_html` in the left panel)

2. **Upload the app files:**
   - On your computer, open: `C:\Users\DELL\Documents\ClinicOS\apps\web\.next\standalone\`
   - Select ALL files and folders inside this folder
   - Upload them to `public_html/`

3. **Upload the static files (CSS, JavaScript, images):**
   - In File Manager inside `public_html`, look for a `.next` folder
   - If it doesn't exist, click **"New Folder"** → name it `.next`
   - Open the `.next` folder → click **"New Folder"** → name it `static`
   - Open the `static` folder
   - On your computer, open: `C:\Users\DELL\Documents\ClinicOS\apps\web\.next\static\`
   - Select ALL → upload to `public_html/.next/static/`

4. **Upload the public files:**
   - On your computer, open: `C:\Users\DELL\Documents\ClinicOS\apps\web\public\`
   - Select ALL files → upload to `public_html/`
   - This includes `.htaccess`, `favicon.svg`, `robots.txt`

5. **Upload the frontend config:**
   - On your computer, go to: `C:\Users\DELL\Documents\ClinicOS\apps\web\`
   - Find the file `.env.local` → upload it to `public_html/`

After uploading, `public_html` must contain:
```
public_html/
├── .htaccess         ← CRITICAL — routes /api calls to backend
├── .env.local        ← frontend config
├── favicon.svg
├── robots.txt
├── server.js         ← Next.js server
├── .next/
│   └── static/       ← CSS and JavaScript
└── node_modules/     ← frontend packages
```

✅ Frontend files uploaded.

---

## STEP 5 — SET UP NODE.JS APP AND START SERVER

### Part A — Create the app

1. In cPanel → scroll down to **"Software"** section → click **"Setup Node.js App"**

2. Click the green **"Create Application"** button (top right corner)

3. Fill in exactly:
   - **Node.js version:** `20` (select from dropdown — if 20 not available, choose 18)
   - **Application mode:** `Production`
   - **Application root:** `clinicos-api`
   - **Application URL:** select `clinicos.workee.online` from dropdown
   - **Application startup file:** `dist/app.js`

4. Click **"Create"**

### Part B — Install and set up database

5. Your app appears in the list. Click the **pencil icon** (✏️) on the right side of the row

6. On the next page, click **"Open Terminal"** — a black box opens inside your browser

7. Click inside the black box so your cursor appears there

8. Type this and press Enter — wait for it to finish:
   ```
   npm install
   ```
   *(Takes 2-3 minutes — many lines scroll by, that is normal)*

9. Type this and press Enter — wait:
   ```
   npx prisma migrate deploy
   ```
   *(You should see "Applied X migrations" — this creates all database tables)*

### Part C — Set your super admin password ⚠️ DO NOT SKIP

10. Still in the same black terminal box, type this command.
    Choose your own admin password — this example uses `Clinicos@2026` but pick anything you want:
    ```
    node -e "require('bcrypt').hash('Clinicos@2026', 12).then(h => console.log(h))"
    ```
    Press Enter. After 3-4 seconds it prints something like:
    ```
    $2b$12$AbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYz
    ```

11. **Copy that entire line** — select it with your mouse and copy it

12. Go to cPanel → File Manager → open `clinicos-api` folder
    → click `.env` file → click **"Edit"** in the toolbar

13. Find this line:
    ```
    SUPERADMIN_PASSWORD_HASH=REPLACE_WITH_BCRYPT_HASH
    ```
    Delete `REPLACE_WITH_BCRYPT_HASH` and paste the `$2b$12$...` text you copied

14. Click **"Save Changes"** → close the editor

### Part D — Start the server

15. Go back to the black terminal box and type:
    ```
    npm install -g pm2
    ```
    Press Enter — wait for it to finish.

16. Type:
    ```
    pm2 start ecosystem.config.js --env production
    ```
    Press Enter.

17. Type:
    ```
    pm2 save
    ```
    Press Enter.

18. Go back to the Setup Node.js App page → click **"Restart"** button

✅ Server is running.

---

## STEP 6 — ENABLE FREE HTTPS (SSL)

1. In cPanel → find **"Security"** section → click **"SSL/TLS"** or **"Let's Encrypt SSL"**

2. Find `clinicos.workee.online` in the list

3. Click **"Issue"** or **"Run AutoSSL"**

4. Wait 2-3 minutes

5. Test it — open your browser and visit:
   ```
   https://clinicos.workee.online/health
   ```
   You must see: `{"status":"ok","app":"ClinicOS AI"}`

   If you see this, your server is live ✅

---

## STEP 7 — TEST EVERYTHING

Go through this list one by one in your browser:

- [ ] `https://clinicos.workee.online` → landing page loads with teal header
- [ ] `https://clinicos.workee.online/health` → shows `{"status":"ok"}`
- [ ] `https://clinicos.workee.online/login` → login form appears
- [ ] `https://clinicos.workee.online/register` → registration form appears
- [ ] `https://clinicos.workee.online/book/dr-ahmed-rahman` → booking page loads
- [ ] `https://clinicos.workee.online/superadmin/login`:
  - Email: `support@clinicos.workee.online`
  - Password: whatever you chose in Step 5 Part C (e.g. `Clinicos@2026`)

---

## YOUR IMPORTANT LOGINS (save this)

| What | URL | Email | Password |
|------|-----|-------|----------|
| **Your admin panel** | /superadmin/login | support@clinicos.workee.online | what you set in Step 5C |
| **Test doctor** | /login | rahman@test.clinicos.ai | TestPass123! |
| **Test staff** | /login | staff@test.clinicos.ai | TestPass123! |
| **Test booking** | /book/dr-ahmed-rahman | — | — |

---

## IF SOMETHING DOESN'T WORK

**Server not starting / blank page:**
- cPanel → Setup Node.js App → pencil icon → Open Terminal
- Type: `pm2 logs clinicos-api --lines 50`
- Look at the red error text — it tells you exactly what's wrong

**"Cannot connect to database" error:**
- You may have typed the wrong password when creating `clinicos_user`
- The password must be exactly: `4mQ6S77xZ3TiGs`
- Fix: cPanel → MySQL Databases → MySQL Users → Change Password for `clinicos_user`

**Admin panel login says "wrong password":**
- You skipped Step 5 Part C
- Go back and do it now — it only takes 2 minutes

**Website loads but API calls fail (dashboard shows no data):**
- Check that `.htaccess` was uploaded to `public_html` correctly
- Test: visit `https://clinicos.workee.online/api/health`

---

## ADD THESE AFTER LAUNCH (not needed now)

| What | Where to sign up | Time needed |
|------|-----------------|-------------|
| WhatsApp & SMS sending | https://twilio.com | 30 min |
| Doctor subscription payments | https://stripe.com | 1 hour |
| AI voice calls | https://elevenlabs.io | 20 min |

When ready: add the keys to `clinicos-api/.env` in File Manager → save → type `pm2 restart clinicos-api` in terminal.
