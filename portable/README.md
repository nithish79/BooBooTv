# OpenIPTV - Portable Edition

A zero-install, standalone, open-source IPTV streaming player with transparent HLS proxying, multi-source failover, and comprehensive 30,000+ channel catalog (Free-TV & IPTV-Org).

---

## 🚀 Tier 1: Zero-Install Portable Player (Windows & USB Ready)

**No installation, Node.js, or Docker required!**

1. Copy this entire `portable` folder anywhere — to your **Desktop**, **Documents**, or a **USB Flash Drive**.
2. **Double-click `start-portable.bat`**:
   - The embedded `bin/node.exe` runtime will launch the backend proxy.
   - Your default web browser will automatically open to `http://localhost:3001`.
3. To stop the player:
   - Double-click **`stop-portable.bat`** or press any key in the console window.

### For Linux / macOS Users:
```bash
chmod +x start-portable.sh
./start-portable.sh
```

---

## 🐳 Tier 2: Single-Command Docker Container

Deploy seamlessly on **Linux servers**, **macOS**, **Raspberry Pi**, or home **NAS (Synology / Unraid / QNAP)**:

```bash
# 1. Start container in background
docker compose up -d

# 2. Open browser:
http://localhost:3001

# 3. Stop container
docker compose down
```

---

## 📦 Tier 3: Standalone Distributable Archive (.ZIP)

To generate a standalone distribution zip ready for sharing or USB transfer:

```bash
node ../scripts/package-portable.cjs
```
This creates `release/open-iptv-portable-win64.zip` containing the complete embedded runtime and all built assets.

---

## ⚙️ Configuration (.env)

You can customize port and playback settings by modifying `.env`:
- `PORT=3001` (change to any port you prefer, e.g. 8080 or 3000)
- `HOST=0.0.0.0` (allows watching from phones/tablets on the same local network)
- `DEFAULT_PLAYLIST=...` (default playlist on launch)
