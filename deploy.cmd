@echo off
echo.
echo ====================================================
echo   ClinicOS AI — Build for Deployment
echo   Domain: clinicos.workee.online
echo ====================================================
echo.

echo [1/5] Installing all dependencies...
cd /d %~dp0
npm install
if %errorlevel% neq 0 ( echo ERROR: npm install failed & pause & exit /b 1 )

echo [2/5] Building API (TypeScript → JavaScript)...
cd apps\api
npm run build
if %errorlevel% neq 0 ( echo ERROR: API build failed & pause & exit /b 1 )
cd ..\..

echo [3/5] Generating Prisma client...
cd apps\api
npx prisma generate
if %errorlevel% neq 0 ( echo ERROR: Prisma generate failed & pause & exit /b 1 )
cd ..\..

echo [4/5] Building frontend (Next.js)...
cd apps\web
npm run build
if %errorlevel% neq 0 ( echo ERROR: Web build failed & pause & exit /b 1 )
cd ..\..

echo [5/5] Build complete!
echo.
echo ====================================================
echo   NEXT STEPS — Upload to cPanel:
echo.
echo   BACKEND: Upload apps/api/ to ~/clinicos-api/
echo            (include: dist/, prisma/, package.json, .env, ecosystem.config.js)
echo            (exclude: node_modules/, src/)
echo.
echo   FRONTEND: Upload apps/web/.next/standalone/ to public_html/
echo             Upload apps/web/.next/static/    to public_html/.next/static/
echo             Upload apps/web/public/          to public_html/
echo.
echo   Then in cPanel Setup Node.js App terminal:
echo     npm install
echo     npx prisma migrate deploy
echo     node dist/app.js (test it)
echo     npm install -g pm2
echo     pm2 start ecosystem.config.js --env production
echo     pm2 save
echo ====================================================
echo.
pause
