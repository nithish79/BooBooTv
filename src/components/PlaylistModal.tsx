import React from 'react';
import { X, Tv } from 'lucide-react';
import { IptvOrgBrowser } from './IptvOrgBrowser';
import { PlaylistData } from '../types';

interface PlaylistModalProps {
  currentUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onLoadUrl: (url: string, name?: string) => void;
  onLoadCustomData: (data: PlaylistData) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  currentUrl,
  isOpen,
  onClose,
  onLoadUrl,
  onLoadCustomData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-dark-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">IPTV Database & Playlist Hub</h3>
              <p className="text-[11px] text-slate-400">
                Explore 30,000+ channels from Free-TV & IPTV-Org, sorted by category and country.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Browser */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <IptvOrgBrowser
            currentUrl={currentUrl}
            onSelectPlaylist={onLoadUrl}
            onLoadCustomData={onLoadCustomData}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};
