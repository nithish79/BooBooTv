import React from 'react';
import {
  Play,
  RotateCw,
  Settings,
  HelpCircle,
  FolderOpen,
  PanelLeftClose,
  PanelLeft,
  Github,
  Trophy,
  Film,
  Newspaper,
  Globe,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  playlistTitle: string;
  isSidebarOpen: boolean;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onOpenPlaylistModal: () => void;
  onSelectQuickPreset: (url: string, name: string) => void;
  onReloadPlaylist: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  playlistTitle,
  isSidebarOpen,
  isLoading,
  onToggleSidebar,
  onOpenPlaylistModal,
  onSelectQuickPreset,
  onReloadPlaylist,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  return (
    <header className="h-14 bg-dark-900 border-b border-slate-800/80 px-3 md:px-4 flex items-center justify-between select-none flex-shrink-0 z-40">
      {/* Left: Sidebar Toggle + Brand */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition"
          title={isSidebarOpen ? 'Collapse Sidebar (S)' : 'Expand Sidebar (S)'}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
            <Play className="w-4 h-4 text-dark-950 fill-current ml-0.5" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-white tracking-tight">OpenIPTV</span>
            <span className="text-[10px] bg-brand-500/20 text-brand-400 font-semibold px-1.5 py-0.2 rounded border border-brand-500/30">
              v2.0
            </span>
          </div>
        </div>
      </div>

      {/* Center: Current Playlist Badge & Quick Presets */}
      <div className="flex items-center gap-2 max-w-xl truncate">
        {/* Main Playlist Pill */}
        <button
          onClick={onOpenPlaylistModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-950/90 hover:bg-dark-850 border border-slate-700/80 hover:border-brand-500/60 text-xs text-slate-300 transition group shadow-sm"
          title="Click to open IPTV Database & Hub"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400 text-[11px] hidden lg:inline">Active:</span>
          <span className="font-bold text-white max-w-[140px] md:max-w-[200px] truncate">
            {playlistTitle}
          </span>
          <span className="text-[10px] bg-brand-500/20 text-brand-400 px-1.5 py-0.2 rounded font-semibold group-hover:bg-brand-500 group-hover:text-dark-950 transition">
            Browse Hub ▾
          </span>
        </button>

        {/* Quick Presets Shortcuts (Desktop) */}
        <div className="hidden xl:flex items-center gap-1 border-l border-slate-800 pl-2">
          <button
            onClick={() => onSelectQuickPreset('https://iptv-org.github.io/iptv/categories/sports.m3u', 'IPTV-Org: Sports')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-amber-300 hover:bg-dark-800/80 transition"
          >
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>Sports</span>
          </button>

          <button
            onClick={() => onSelectQuickPreset('https://iptv-org.github.io/iptv/categories/movies.m3u', 'IPTV-Org: Movies')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-rose-300 hover:bg-dark-800/80 transition"
          >
            <Film className="w-3 h-3 text-rose-400" />
            <span>Movies</span>
          </button>

          <button
            onClick={() => onSelectQuickPreset('https://iptv-org.github.io/iptv/categories/news.m3u', 'IPTV-Org: News')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-sky-300 hover:bg-dark-800/80 transition"
          >
            <Newspaper className="w-3 h-3 text-sky-400" />
            <span>News</span>
          </button>

          <button
            onClick={() => onSelectQuickPreset('https://iptv-org.github.io/iptv/countries/in.m3u', 'IPTV-Org: India 🇮🇳')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-emerald-300 hover:bg-dark-800/80 transition"
          >
            <span className="text-xs">🇮🇳</span>
            <span>India</span>
          </button>

          <button
            onClick={() => onSelectQuickPreset('https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8', 'Free-TV Global')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-brand-300 hover:bg-dark-800/80 transition"
          >
            <Sparkles className="w-3 h-3 text-brand-400" />
            <span>Free-TV</span>
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenPlaylistModal}
          className="flex xl:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition"
          title="Switch Playlist"
        >
          <FolderOpen className="w-4 h-4" />
        </button>

        <button
          onClick={onReloadPlaylist}
          disabled={isLoading}
          className={`p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Reload Playlist"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-400' : ''}`} />
        </button>

        <button
          onClick={onOpenShortcuts}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <a
          href="https://github.com/iptv-org/iptv"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800/80 hover:bg-dark-700/80 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition ml-1"
          title="View iptv-org on GitHub (30,000+ channels)"
        >
          <Github className="w-3.5 h-3.5" />
          <span>iptv-org</span>
        </a>
      </div>
    </header>
  );
};
