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
} from 'lucide-react';

interface HeaderProps {
  playlistName: string;
  isSidebarOpen: boolean;
  isLoading: boolean;
  onToggleSidebar: () => void;
  onOpenPlaylistModal: () => void;
  onReloadPlaylist: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  playlistName,
  isSidebarOpen,
  isLoading,
  onToggleSidebar,
  onOpenPlaylistModal,
  onReloadPlaylist,
  onOpenSettings,
  onOpenShortcuts,
}) => {
  return (
    <header className="h-14 bg-dark-900 border-b border-slate-800/80 px-4 flex items-center justify-between select-none flex-shrink-0 z-40">
      {/* Left: Sidebar Toggle + Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition"
          title={isSidebarOpen ? 'Collapse Sidebar (S)' : 'Expand Sidebar (S)'}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center shadow-md shadow-brand-500/20">
            <Play className="w-4 h-4 text-dark-950 fill-current ml-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm text-white tracking-tight">OpenIPTV</span>
              <span className="text-[10px] bg-brand-500/20 text-brand-400 font-semibold px-1.5 py-0.2 rounded border border-brand-500/30">
                v1.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Current Active Playlist Pill */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-950/80 border border-slate-800 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-slate-400">Playlist:</span>
          <span className="font-medium text-white max-w-[200px] lg:max-w-xs truncate">
            {playlistName}
          </span>
          <button
            onClick={onOpenPlaylistModal}
            className="text-brand-400 hover:text-brand-300 ml-1 font-semibold hover:underline"
          >
            Change
          </button>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenPlaylistModal}
          className="flex md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-dark-800 transition"
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
          href="https://github.com/Free-TV/IPTV"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-800/80 hover:bg-dark-700/80 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition ml-1"
          title="View Free-TV IPTV on GitHub"
        >
          <Github className="w-3.5 h-3.5" />
          <span>Free-TV</span>
        </a>
      </div>
    </header>
  );
};
