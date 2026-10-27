@echo off
echo ========================================================
echo Installing Dependencies for Club Activities Management System
echo ========================================================

echo 1/2 Installing server dependencies...
cd /d "%~dp0server"
call npm.cmd install
if %ERRORLEVEL% neq 0 (
    echo Error installing server dependencies!
    pause
    exit /b %ERRORLEVEL%
)

echo 2/2 Installing client dependencies...
cd /d "%~dp0client"
call npm.cmd install
if %ERRORLEVEL% neq 0 (
    echo Error installing client dependencies!
    pause
    exit /b %ERRORLEVEL%
)

echo ========================================================
echo All dependencies installed successfully!
echo You can now double-click "run.bat" to start the application.
echo ========================================================
pause
