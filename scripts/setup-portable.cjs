const fs = require('fs');
const path = require('path');

// 1. Create start-portable.bat
const startBat = `@echo off
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
if exist "bin\\node.exe" (
    set "NODE_EXE=bin\\node.exe"
    echo [*] Using bundled portable Node.js runtime (bin\\node.exe)
) else (
    where node >nul 2>nul
    if !errorlevel! equ 0 (
        set "NODE_EXE=node"
        echo [*] Using system Node.js runtime
    ) else (
        echo [!] ERROR: Node.js runtime not found!
        echo Please ensure bin\\node.exe exists in this folder.
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
timeout /t 2 /nobreak >nul

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
`;

fs.writeFileSync(path.join(__dirname, '../portable/start-portable.bat'), startBat);
console.log('Created portable/start-portable.bat');

// 2. Create stop-portable.bat
const stopBat = `@echo off
title OpenIPTV - Stopping Server...
cd /d "%~dp0"

echo [*] Stopping OpenIPTV server running on port 3001...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do (
    echo [*] Terminating process PID: %%a
    taskkill /F /PID %%a >nul 2>nul
)

echo [OK] OpenIPTV server stopped cleanly.
timeout /t 2 /nobreak >nul
`;

fs.writeFileSync(path.join(__dirname, '../portable/stop-portable.bat'), stopBat);
console.log('Created portable/stop-portable.bat');

// 3. Create start-portable.sh (Linux/macOS)
const startSh = `#!/usr/bin/env bash
cd "$(dirname "$0")"

echo "====================================================================="
echo "                    OpenIPTV - Portable Edition"
echo "====================================================================="

if command -v node >/dev/null 2>&1; then
    NODE_CMD="node"
elif [ -f "./bin/node" ]; then
    NODE_CMD="./bin/node"
else
    echo "[!] Node.js runtime not found. Please install node or place binary in bin/node."
    exit 1
fi

export PORT=3001
export NODE_ENV=production

echo "[*] Starting OpenIPTV server on port 3001..."
$NODE_CMD dist/server/index.js &
SERVER_PID=$!

echo "[*] Server started with PID: $SERVER_PID"
sleep 2

URL="http://localhost:3001"
echo "[*] Opening $URL ..."
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
elif command -v open >/dev/null 2>&1; then
    open "$URL"
fi

wait $SERVER_PID
`;

fs.writeFileSync(path.join(__dirname, '../portable/start-portable.sh'), startSh);
console.log('Created portable/start-portable.sh');

// 4. Create .env and .env.example
const envExample = `# OpenIPTV Portable Configuration
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
AUTO_OPEN_BROWSER=true
DEFAULT_PLAYLIST=https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8
`;

fs.writeFileSync(path.join(__dirname, '../portable/.env'), envExample);
fs.writeFileSync(path.join(__dirname, '../portable/.env.example'), envExample);
console.log('Created portable/.env and .env.example');

// 5. Create Tier 2: Dockerfile and docker-compose.yml
const dockerfile = `# Tier 2: Self-contained OpenIPTV Portable Container
FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json ./
RUN npm install --omit=dev --no-audit

COPY dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \\
  CMD wget -qO- http://localhost:3001/api/iptv-org/catalog || exit 1

CMD ["node", "dist/server/index.js"]
`;

fs.writeFileSync(path.join(__dirname, '../portable/Dockerfile'), dockerfile);
console.log('Created portable/Dockerfile');

const dockerCompose = `services:
  open-iptv:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: open-iptv-portable
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - NODE_ENV=production
`;

fs.writeFileSync(path.join(__dirname, '../portable/docker-compose.yml'), dockerCompose);
console.log('Created portable/docker-compose.yml');

// 6. Create Tier 3: Packaging script (package-zip.cjs)
const packageZip = `const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=====================================================================');
console.log('         Tier 3: Packaging Standalone Portable Distribution');
console.log('=====================================================================');

const portableDir = path.resolve(__dirname, '../portable');
const releaseDir = path.resolve(__dirname, '../release');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

const zipPath = path.join(releaseDir, 'open-iptv-portable-win64.zip');

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log('[*] Creating portable zip archive:', zipPath);
console.log('[*] Compressing portable directory...');

// Use PowerShell Compress-Archive
const cmd = \`powershell.exe -NoProfile -Command "Compress-Archive -Path '\${portableDir}\\\\*' -DestinationPath '\${zipPath}' -Force"\`;
execSync(cmd, { stdio: 'inherit' });

const stats = fs.statSync(zipPath);
console.log('\\n[SUCCESS] Packaged OpenIPTV Portable!');
console.log('Archive File: ', zipPath);
console.log('Archive Size: ', (stats.size / 1024 / 1024).toFixed(2), 'MB');
console.log('Ready to copy to any USB flash drive or Windows PC with ZERO installation!');
`;

fs.writeFileSync(path.join(__dirname, '../scripts/package-portable.cjs'), packageZip);
console.log('Created scripts/package-portable.cjs');

// 7. Create README.md inside portable/
const portableReadme = `# OpenIPTV - Portable Edition

A zero-install, standalone, open-source IPTV streaming player with transparent HLS proxying, multi-source failover, and comprehensive 30,000+ channel catalog (Free-TV & IPTV-Org).

---

## 🚀 Tier 1: Zero-Install Portable Player (Windows & USB Ready)

**No installation, Node.js, or Docker required!**

1. Copy this entire \`portable\` folder anywhere — to your **Desktop**, **Documents**, or a **USB Flash Drive**.
2. **Double-click \`start-portable.bat\`**:
   - The embedded \`bin/node.exe\` runtime will launch the backend proxy.
   - Your default web browser will automatically open to \`http://localhost:3001\`.
3. To stop the player:
   - Double-click **\`stop-portable.bat\`** or press any key in the console window.

### For Linux / macOS Users:
\`\`\`bash
chmod +x start-portable.sh
./start-portable.sh
\`\`\`

---

## 🐳 Tier 2: Single-Command Docker Container

Deploy seamlessly on **Linux servers**, **macOS**, **Raspberry Pi**, or home **NAS (Synology / Unraid / QNAP)**:

\`\`\`bash
# 1. Start container in background
docker compose up -d

# 2. Open browser:
http://localhost:3001

# 3. Stop container
docker compose down
\`\`\`

---

## 📦 Tier 3: Standalone Distributable Archive (.ZIP)

To generate a standalone distribution zip ready for sharing or USB transfer:

\`\`\`bash
node ../scripts/package-portable.cjs
\`\`\`
This creates \`release/open-iptv-portable-win64.zip\` containing the complete embedded runtime and all built assets.

---

## ⚙️ Configuration (.env)

You can customize port and playback settings by modifying \`.env\`:
- \`PORT=3001\` (change to any port you prefer, e.g. 8080 or 3000)
- \`HOST=0.0.0.0\` (allows watching from phones/tablets on the same local network)
- \`DEFAULT_PLAYLIST=...\` (default playlist on launch)
`;

fs.writeFileSync(path.join(__dirname, '../portable/README.md'), portableReadme);
console.log('Created portable/README.md');

console.log('\\n[SUCCESS] All 3 Tiers generated inside portable/ successfully!');
