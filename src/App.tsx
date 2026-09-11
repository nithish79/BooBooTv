import { useState, useEffect, useMemo, useCallback } from 'react';
import { Channel, GroupInfo, PlaylistData, AppSettings, AspectRatio } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChannelList } from './components/ChannelList';
import { VideoPlayer } from './components/VideoPlayer';
import { SettingsModal } from './components/SettingsModal';
import { PlaylistModal } from './components/PlaylistModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';

const DEFAULT_PLAYLIST_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

const DEFAULT_SETTINGS: AppSettings = {
  streamingMode: 'auto',
  audioBoost: false,
  aspectRatio: '16:9',
  lowLatency: true,
  autoPlay: true,
};

export default function App() {
  const [playlistUrl, setPlaylistUrl] = useLocalStorage<string>('openiptv_playlist_url', DEFAULT_PLAYLIST_URL);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groups, setGroups] = useState<GroupInfo[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // User state
  const [favorites, setFavorites] = useLocalStorage<string[]>('openiptv_favorites', []);
  const [recents, setRecents] = useLocalStorage<Channel[]>('openiptv_recents', []);
  const [settings, setSettings] = useLocalStorage<AppSettings>('openiptv_settings', DEFAULT_SETTINGS);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('__ALL__');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('openiptv_view_mode', 'grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const favoriteIdsSet = useMemo(() => new Set(favorites), [favorites]);

  // Fetch playlist from server or custom source
  const loadPlaylist = useCallback(async (url: string, reload = false) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const endpoint = `/api/playlist?url=${encodeURIComponent(url)}${reload ? '&reload=true' : ''}`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      const data: PlaylistData = await res.json();
      setChannels(data.channels);
      setGroups(data.groups);

      // Auto-select first channel if none selected
      if (data.channels.length > 0 && !activeChannel) {
        // Leave activeChannel as null or select first
      }
    } catch (err: any) {
      console.error('Failed to load playlist:', err);
      setLoadError(err.message || 'Failed to load playlist');
    } finally {
      setIsLoading(false);
    }
  }, [activeChannel]);

  useEffect(() => {
    loadPlaylist(playlistUrl);
  }, [playlistUrl, loadPlaylist]);

  // Handle channel selection
  const handleSelectChannel = useCallback((channel: Channel) => {
    setActiveChannel(channel);

    // Update Recents
    setRecents((prev) => {
      const filtered = prev.filter((c) => c.id !== channel.id);
      return [channel, ...filtered].slice(0, 30);
    });
  }, [setRecents]);

  // Toggle Favorite
  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((favId) => favId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, [setFavorites]);

  // Clear handlers
  const handleClearHistory = () => setRecents([]);
  const handleClearFavorites = () => setFavorites([]);

  // Filter channels based on category selection
  const displayedChannels = useMemo(() => {
    if (selectedCategory === '__FAVORITES__') {
      return channels.filter((c) => favoriteIdsSet.has(c.id));
    }
    if (selectedCategory === '__RECENT__') {
      return recents;
    }
    return channels;
  }, [channels, selectedCategory, favoriteIdsSet, recents]);

  // Next / Previous Channel Navigation
  const handleNextChannel = useCallback(() => {
    if (!activeChannel || displayedChannels.length === 0) return;
    const currentIndex = displayedChannels.findIndex((c) => c.id === activeChannel.id);
    const nextIndex = (currentIndex + 1) % displayedChannels.length;
    handleSelectChannel(displayedChannels[nextIndex]);
  }, [activeChannel, displayedChannels, handleSelectChannel]);

  const handlePrevChannel = useCallback(() => {
    if (!activeChannel || displayedChannels.length === 0) return;
    const currentIndex = displayedChannels.findIndex((c) => c.id === activeChannel.id);
    const prevIndex = (currentIndex - 1 + displayedChannels.length) % displayedChannels.length;
    handleSelectChannel(displayedChannels[prevIndex]);
  }, [activeChannel, displayedChannels, handleSelectChannel]);

  // Custom client data load (from uploaded file)
  const handleLoadCustomData = (data: PlaylistData) => {
    setChannels(data.channels);
    setGroups(data.groups);
    setPlaylistUrl('Uploaded File: ' + data.url);
    setSelectedCategory('__ALL__');
    setActiveChannel(null);
  };

  // Keyboard shortcuts wiring
  useKeyboardShortcuts({
    onTogglePlay: () => {
      const video = document.querySelector('video');
      if (video) {
        if (video.paused) video.play().catch(console.warn);
        else video.pause();
      }
    },
    onToggleMute: () => {
      const video = document.querySelector('video');
      if (video) video.muted = !video.muted;
    },
    onToggleFullscreen: () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(console.warn);
      } else {
        document.exitFullscreen().catch(console.warn);
      }
    },
    onTogglePiP: () => {
      const video = document.querySelector('video');
      if (video && document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(console.warn);
      } else if (video) {
        video.requestPictureInPicture().catch(console.warn);
      }
    },
    onVolumeUp: () => {
      const video = document.querySelector('video');
      if (video) video.volume = Math.min(1, video.volume + 0.05);
    },
    onVolumeDown: () => {
      const video = document.querySelector('video');
      if (video) video.volume = Math.max(0, video.volume - 0.05);
    },
    onPrevChannel: handlePrevChannel,
    onNextChannel: handleNextChannel,
    onToggleSidebar: () => setIsSidebarOpen((prev) => !prev),
    onFocusSearch: () => {
      const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      input?.focus();
    },
    onToggleShortcutsModal: () => setIsShortcutsOpen((prev) => !prev),
  });

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-dark-950">
      {/* Top Header */}
      <Header
        playlistName={playlistUrl.includes('master/playlist.m3u8') ? 'Free-TV Global' : playlistUrl}
        isSidebarOpen={isSidebarOpen}
        isLoading={isLoading}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenPlaylistModal={() => setIsPlaylistOpen(true)}
        onReloadPlaylist={() => loadPlaylist(playlistUrl, true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category & Country Sidebar */}
        <Sidebar
          groups={groups}
          totalChannels={channels.length}
          selectedCategory={selectedCategory}
          favoritesCount={favorites.length}
          recentsCount={recents.length}
          isOpen={isSidebarOpen}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* Channels Browser Grid / List */}
        <div className="w-full md:w-[380px] lg:w-[460px] xl:w-[500px] flex-shrink-0 h-full flex flex-col border-r border-slate-800">
          <ChannelList
            channels={displayedChannels}
            activeChannel={activeChannel}
            favoriteIds={favoriteIdsSet}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            viewMode={viewMode}
            onSearchChange={setSearchQuery}
            onSelectChannel={handleSelectChannel}
            onToggleFavorite={handleToggleFavorite}
            onChangeViewMode={setViewMode}
          />
        </div>

        {/* Video Player Display */}
        <main className="flex-1 h-full flex flex-col bg-black overflow-hidden relative">
          <VideoPlayer
            channel={activeChannel}
            streamingMode={settings.streamingMode}
            audioBoost={settings.audioBoost}
            aspectRatio={settings.aspectRatio}
            lowLatency={settings.lowLatency}
            autoPlay={settings.autoPlay}
            onPrevChannel={handlePrevChannel}
            onNextChannel={handleNextChannel}
            onChangeAspectRatio={(ratio: AspectRatio) =>
              setSettings((s) => ({ ...s, aspectRatio: ratio }))
            }
            onToggleAudioBoost={() =>
              setSettings((s) => ({ ...s, audioBoost: !s.audioBoost }))
            }
            onSwitchToProxyMode={() =>
              setSettings((s) => ({ ...s, streamingMode: 'proxy' }))
            }
          />
        </main>
      </div>

      {/* Modals */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={(newVals) => setSettings((s) => ({ ...s, ...newVals }))}
        onClearHistory={handleClearHistory}
        onClearFavorites={handleClearFavorites}
      />

      <PlaylistModal
        currentUrl={playlistUrl}
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        onLoadUrl={(url) => {
          setPlaylistUrl(url);
          loadPlaylist(url, true);
        }}
        onLoadCustomData={handleLoadCustomData}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
