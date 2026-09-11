# 📺 OpenIPTV for Android TV

A dedicated, native Android TV IPTV application engineered for the 10-foot television experience, featuring hardware-accelerated HLS streaming, Leanback launcher integration, and comprehensive TV remote control navigation.

---

## 🎮 Android TV Remote Control Guide

| Remote Button | Mode | Action |
| :--- | :--- | :--- |
| **DPAD_CENTER / OK / ENTER** | Live Fullscreen Video | Opens Channel Guide Drawer & OSD |
| **DPAD_CENTER / OK / ENTER** | In Channel Guide | Plays highlighted channel immediately |
| **Long-Press OK / Yellow Button** | Any | Adds/Removes channel to **★ Favorites** |
| **DPAD_UP** | Live Fullscreen Video | **Quick Channel Zap** to previous channel |
| **DPAD_DOWN** | Live Fullscreen Video | **Quick Channel Zap** to next channel |
| **DPAD_LEFT** | Fullscreen or Guide | Opens **Category Sidebar** (Favorites, Recents, Genres, Countries) |
| **DPAD_RIGHT** | Live Fullscreen Video | Opens **Player Settings** (Aspect Ratio & Audio Boost) |
| **BACK** | In Any Overlay | Closes drawer/overlay and returns to Fullscreen Video |
| **BACK** | In Fullscreen Video | Double-press confirmation to exit app safely |
| **MEDIA_PLAY_PAUSE** | Any | Toggles playback pause/resume |
| **CHANNEL_UP / CHANNEL_DOWN**| Any | Instant channel switcher |

---

## ✨ Features

- **Built-in Free-TV Global Master Playlist**: 2,000+ live television channels across 97 countries preloaded.
- **Curated Presets**: Quick one-click switching to:
  - Free-TV Global Master (2,000+ channels)
  - Live Sports ⚽ (500+ sports broadcasts)
  - Movies & Cinema 🎬 (800+ cinema channels)
  - 24/7 Global News 📰 (1,000+ live news streams)
  - Music & Concerts 🎵 (700+ music TV networks)
  - India Live TV 🇮🇳 (750+ Indian national & regional channels)
  - United States 🇺🇸 (350+ American channels)
  - United Kingdom 🇬🇧 (180+ British channels)
- **Direct Hardware Accelerated Streaming**: Powered by **AndroidX Media3 ExoPlayer** with direct HLS / TS playback, zero CORS restrictions, and custom TV user agents.
- **Smart Automatic Fallback**: Automatically switches to alternative verified stream mirrors if an upstream server goes down.
- **On-Screen Display (OSD)**: Displays channel number, logo, title, category, stream resolution, and source count with 4-second auto-hide.
- **Player Settings**:
  - **Aspect Ratio Switcher**: 16:9, 4:3, Stretch (Fill), and Zoom (Crop).
  - **Audio Volume Booster**: 100%, 150%, and 200% amplification.
- **TV Remote Search**: Instant channel filtering using remote D-pad input.
- **Persistent Favorites & Recents**: Fast bookmarking with offline persistence.

---

## 🚀 How to Install on Android TV / Fire TV

### Option 1: Direct ADB over Wi-Fi (Recommended)
1. Enable **Developer Options** and **ADB Debugging** on your Android TV / Google TV / Fire TV:
   - Go to **Settings** > **Device Preferences** / **System** > **About**.
   - Tap **Build** / **OS Version** 7 times until you see *""You are now a developer!""*.
   - Go back to **Developer options** and turn on **Network debugging** / **ADB debugging**.
2. Note your TV's IP address (e.g. 192.168.1.50).
3. In PowerShell or Command Prompt, run:
   `ash
   adb connect 192.168.1.50:5555
   adb install -r "app\build\outputs\apk\debug\app-debug.apk"
   `

### Option 2: USB Drive / Send Files to TV
1. Copy pp-debug.apk to a USB drive or transfer using the **Send Files to TV** app.
2. Install via any file manager on your TV (e.g. FX File Explorer or Downloader).

---

## 🛠️ Building with Android Studio or CLI

- **Command Line**:
  `ash
  .\gradlew.bat assembleDebug
  `
- **Android Studio**:
  Open the Android TV folder directly in Android Studio. Select **Run** (Shift + F10) to deploy to your TV or emulator.
