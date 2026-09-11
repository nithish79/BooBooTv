@echo off
setlocal enabledelayedexpansion
title OpenIPTV - Portable Player
cd /d "%~dp0"

cls
echo =====================================================================
echo                     OpenIPTV - Portable Edition
echo          Zero-Install Live Streaming Player with HLS Proxy
echo =====================================================================
echo.

:: 1. Detect Node Runtime
set "NODE_EXE="
if exist "bin\node.exe" (
    set "NODE_EXE=bin\node.exe"
    echo [*] Using bundled portable Node.js runtime (bin\node.exe)
) else (
    where node >nul 2>nul
    if !errorlevel! equ 0 (
        set "NODE_EXE=node"
        echo [*] Using system Node.js runtime
    ) else (
        echo [!] ERROR: Node.js runtime not found!
        echo Please ensure bin\node.exe exists in this folder.
        pause
        exit /b 1
    )
)

:: 2. Check if Port 3001 is already running
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>nul
if !errorlevel! equ 0 (
    echo [i] OpenIPTV server is already running on port 3001!
    echo [*] Opening browser to http://localhost:3001 ...
    start "" "http://localhost:3001"
    goto :running
)

:: 3. Launch Server Process
echo [*] Starting OpenIPTV server on port 3001...
set "PORT=3001"
set "NODE_ENV=production"

start "OpenIPTV Server" /min "%NODE_EXE%" dist/server/index.js

:: 4. Wait for Server to initialize
echo [*] Initializing streaming services...
ping 127.0.0.1 -n 3 >nul 2>nul

:: 5. Open Web Browser
echo [*] Launching web player in your default browser...
start "" "http://localhost:3001"

:running
echo.
echo =====================================================================
echo [OK] OpenIPTV is running live!
echo      Web URL:  http://localhost:3001
echo      To Stop:  Double-click stop-portable.bat or press any key below.
echo =====================================================================
echo.
pause

call "%~dp0stop-portable.bat"
