@echo off
title Goyoo Local Certificate Installer
echo =====================================================
echo   Goyoo Printer Proxy HTTPS Certificate Installer
echo =====================================================
echo.

set CERT_PATH=%~dp0cert.pem

if not exist "%CERT_PATH%" (
    echo Certificate file 'cert.pem' not found.
    echo    This file must be located in the same folder as this batch file.
    pause
    exit /b 1
)

echo Checking for administrator privileges...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Restart this script as an administrator.
    echo    (Right-click -> "Run as administrator")
    pause
    exit /b 1
)

echo Adding certificate to Windows Trusted Root Store...
echo.
certutil -addstore -f "Root" "%CERT_PATH%"

if %errorLevel% equ 0 (
    echo.
    echo Certificate successfully installed.
    echo -----------------------------------------------------
    echo  You can now access https://localhost:9443 in your browser
    echo  without seeing security warnings.
    echo -----------------------------------------------------
) else (
    echo Certificate installation failed
)

echo.
pause
exit
