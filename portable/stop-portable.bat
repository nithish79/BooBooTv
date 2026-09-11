@echo off
title OpenIPTV - Stopping Server...
cd /d "%~dp0"

echo [*] Stopping OpenIPTV server running on port 3001...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo [*] Terminating process PID: %%a
    taskkill /F /PID %%a >nul 2>nul
)

echo [OK] OpenIPTV server stopped cleanly.
ping 127.0.0.1 -n 2 >nul 2>nul
