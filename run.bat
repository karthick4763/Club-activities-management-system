@echo off
echo ========================================================
echo Starting Club Activities Management System...
echo ========================================================

:: Start Backend in a dedicated window
start "Club Management Backend (Port 5005)" cmd /k "cd /d "%~dp0server" && node server.js"

:: Start Frontend in a dedicated window
start "Club Management Frontend (Port 3005)" cmd /k "cd /d "%~dp0client" && npm.cmd run dev"

:: Wait 3 seconds and launch browser
timeout /t 3 >nul
start http://localhost:3005

echo Backend: http://localhost:5005
echo Frontend: http://localhost:3005
echo ========================================================
