# 📺 OpenIPTV — Modern Open Source IPTV Player

<p align="center">
  <img src="https://raw.githubusercontent.com/Free-TV/IPTV/master/resources/logo.png" alt="OpenIPTV" width="120" onerror="this.style.display='none'" />
</p>

<p align="center">
  A high-performance, open-source web and desktop IPTV player engineered to stream 2,000+ public live channels from the <b>Free-TV Master Playlist</b> with built-in CORS bypass, multi-quality HLS streaming, audio boosting, and country/category navigation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/Node.js-22%2B-green.svg" alt="Node.js 22+" />
  <img src="https://img.shields.io/badge/React-19-cyan.svg" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6-purple.svg" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ed.svg" alt="Docker Ready" />
</p>

---

## ✨ Features

- **Pre-configured Free-TV Master Playlist**: Streams **2,068 channels** categorized across **97 countries** out of the box.
- **Built-in CORS & Stream Proxy (`/api/proxy`)**:
  - Automatically rewrites HLS manifests (`.m3u8`), sub-playlists, and encryption keys to bypass browser CORS and geo-blocks.
  - Transparently pipes binary video chunks (`.ts`, `.m4s`, `.mp4`) with HTTP range and keep-alive support.
- **Multi-Format Playback Engine**:
  - **HLS (.m3u8)**: Powered by `hls.js` with adaptive bitrate and manual resolution selector (1080p, 720p, 480p, etc.).
  - **YouTube Live**: Automatically detects and embeds official YouTube live channel streams.
  - **Twitch Live**: Embeds Twitch live channels.
- **200% Audio Booster**: Uses the Web Audio API (`AudioContext` + `GainNode`) to amplify quiet broadcast audio up to 2.0x normal maximum volume.
- **Aspect Ratio Switcher**: Switch between `16:9`, `4:3`, `Stretch (Fill)`, and `Zoom (Cover)` on the fly.
- **Stats for Nerds Overlay**: Real-time diagnostic metrics including live bitrate, resolution, dropped video frames, buffer length, codec, and proxy routing.
- **Channel Navigation**:
  - Instant search filtering by channel title, country code, or category.
  - **Dual View**: Sleek card grid view with logo fallbacks vs. compact list view.
  - **Favorites System**: One-click star/unstar saved to `localStorage`.
  - **Recently Watched History**: Resume watching your favorite channels instantly.
- **Custom Playlists**:
  - Load any remote M3U / M3U8 URL.
  - Drag-and-drop or upload local `.m3u` / `.m3u8` playlist files.
- **Global Keyboard Hotkeys**: Control playback, volume, channel zapping, and search without lifting a hand from the keyboard.
- **Docker Support**: Production-ready multi-stage `Dockerfile` and `docker-compose.yml`.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v20 or higher
- `npm` (v9+)

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/open-iptv.git
cd open-iptv

# Install dependencies
npm install
```

### 2. Development Mode

Runs both the backend streaming proxy (port 3001) and the Vite frontend dev server (port 3000) concurrently:

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

### 3. Production Build & Run

```bash
# Build client and server
npm run build

# Start the unified production server
npm start
```

Open `http://localhost:3000` (or your configured `PORT`).

---

## 🐳 Docker Deployment

You can run OpenIPTV with a single command using Docker:

```bash
# Build and run container
docker compose up -d
```

The application will be accessible at `http://localhost:3000`.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|:---:|:---|
| <kbd>Space</kbd> | Play / Pause active stream |
| <kbd>F</kbd> | Toggle Fullscreen |
| <kbd>P</kbd> | Toggle Picture-in-Picture (PiP) |
| <kbd>M</kbd> | Mute / Unmute audio |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Increase / Decrease volume (5% steps) |
| <kbd>[</kbd> / <kbd>]</kbd> | Previous / Next channel |
| <kbd>S</kbd> | Expand / Collapse Category Sidebar |
| <kbd>/</kbd> | Instant focus to channel search bar |
| <kbd>?</kbd> | Open Keyboard Shortcuts guide |
| <kbd>Esc</kbd> | Close open modal or exit fullscreen |

---

## 🏗️ Architecture

```
open-iptv/
├── server/
│   ├── index.ts        # Express server, health check & static production hosting
│   ├── proxy.ts        # Streaming proxy & M3U8 manifest rewriter
│   ├── playlist.ts     # In-memory cached M3U parser for 2,000+ channels
│   └── types.ts        # Shared server type definitions
├── src/
│   ├── components/
│   │   ├── VideoPlayer.tsx            # Multi-format player (HLS, YouTube, Twitch)
│   │   ├── PlayerControls.tsx         # Auto-hiding on-screen HUD
│   │   ├── ChannelList.tsx            # Infinite-scroll channel browser & search
│   │   ├── ChannelCard.tsx            # Channel card/row with logo fallbacks
│   │   ├── Sidebar.tsx                # Country & category navigation
│   │   ├── Header.tsx                 # Header navigation & playlist switcher
│   │   ├── SettingsModal.tsx          # CORS mode, audio booster, aspect ratio
│   │   ├── PlaylistModal.tsx          # Custom M3U URL & file uploader
│   │   ├── StatsOverlay.tsx           # "Stats for Nerds" diagnostic overlay
│   │   └── KeyboardShortcutsModal.tsx # Hotkey guide modal
│   ├── hooks/
│   │   ├── useHlsPlayer.ts            # HLS.js lifecycle & Web Audio booster
│   │   ├── useLocalStorage.ts         # Persisted state for favorites/recents
│   │   └── useKeyboardShortcuts.ts    # Global key listener
│   ├── types/                         # TypeScript interfaces
│   ├── utils/                         # Client-side M3U file parser
│   ├── App.tsx                        # Main application orchestrator
│   └── main.tsx                       # React DOM root
├── Dockerfile                         # Production multi-stage Docker build
├── docker-compose.yml                 # 1-click Docker orchestration
└── package.json
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `GET` | `/api/health` | Returns server uptime, status, and timestamp |
| `GET` | `/api/playlist` | Returns parsed JSON of channels and categories. Supports `?url=` and `?reload=true` |
| `GET` | `/api/proxy?url=<URL>` | Streaming proxy for M3U8 manifests and video segments |

---

## ⚖️ License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 🙏 Credits & Acknowledgements

- Channel list sourced from [Free-TV/IPTV](https://github.com/Free-TV/IPTV) (Open collection of free publicly available TV channels).
- Icons provided by [Lucide React](https://lucide.dev/).
- Video playback powered by [Hls.js](https://github.com/video-dev/hls.js).
