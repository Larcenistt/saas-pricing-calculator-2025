@echo off
echo ====================================
echo   VERCEL DEPLOYMENT SCRIPT
echo ====================================
echo.

echo Step 1: Checking Vercel login status...
vercel whoami
if %errorlevel% neq 0 (
    echo.
    echo You need to login to Vercel first!
    echo.
    echo Please run: vercel login
    echo Select "Continue with GitHub" and complete authentication
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Deploying to Vercel...
echo.

vercel --yes --prod

echo.
echo ====================================
echo   DEPLOYMENT COMPLETE!
echo ====================================
echo.
echo Your site should be live soon!
echo Check your Vercel dashboard for the URL
echo.
pause