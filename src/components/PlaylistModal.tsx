import React, { useState, useRef } from 'react';
import { X, FolderOpen, Link as LinkIcon, Upload, Check, AlertCircle } from 'lucide-react';
import { parseClientM3U } from '../utils/m3uParser';
import { PlaylistData } from '../types';

interface PlaylistModalProps {
  currentUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onLoadUrl: (url: string) => void;
  onLoadCustomData: (data: PlaylistData) => void;
}

const FREE_TV_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  currentUrl,
  isOpen,
  onClose,
  onLoadUrl,
  onLoadCustomData,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customUrl.trim();
    if (!trimmed) {
      setError('Please enter a valid M3U/M3U8 playlist URL.');
      return;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      setError('Playlist URL must start with http:// or https://');
      return;
    }
    setError(null);
    onLoadUrl(trimmed);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text.includes('#EXTM3U') && !text.includes('#EXTINF')) {
          throw new Error('Selected file does not appear to be a valid M3U/M3U8 playlist.');
        }
        const parsed = parseClientM3U(text, file.name);
        onLoadCustomData(parsed);
        setIsUploading(false);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to parse M3U file.');
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setIsUploading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Select IPTV Playlist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset Free-TV */}
          <div>
            <div className="text-slate-400 font-semibold mb-2 uppercase text-[10px] tracking-wider">
              Default Recommended Playlist
            </div>
            <div
              onClick={() => {
                onLoadUrl(FREE_TV_URL);
                onClose();
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between group ${
                currentUrl === FREE_TV_URL
                  ? 'bg-brand-500/15 border-brand-500/60 text-white'
                  : 'bg-dark-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-dark-850'
              }`}
            >
              <div>
                <div className="font-semibold text-xs text-white flex items-center gap-2">
                  <span>Free-TV Global Master Playlist</span>
                  {currentUrl === FREE_TV_URL && (
                    <span className="text-[10px] bg-brand-500 text-dark-950 px-1.5 py-0.2 rounded font-bold">
                      ACTIVE
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  2,000+ public live channels worldwide, organized by 90+ countries.
                </div>
              </div>
              {currentUrl === FREE_TV_URL ? (
                <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-dark-950">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <button className="px-3 py-1 bg-dark-800 group-hover:bg-brand-500 group-hover:text-dark-950 text-slate-300 text-xs font-semibold rounded-lg transition">
                  Load
                </button>
              )}
            </div>
          </div>

          {/* Custom Remote URL */}
          <div className="border-t border-slate-800/80 pt-4">
            <div className="text-slate-400 font-semibold mb-2 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Load from Remote URL</span>
            </div>
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/playlist.m3u8"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 bg-dark-950 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-dark-800 hover:bg-brand-500 hover:text-dark-950 text-white font-semibold rounded-xl border border-slate-700 hover:border-brand-500 transition"
              >
                Load URL
              </button>
            </form>
          </div>

          {/* File Upload */}
          <div className="border-t border-slate-800/80 pt-4">
            <div className="text-slate-400 font-semibold mb-2 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Local M3U File</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".m3u,.m3u8"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700/80 hover:border-brand-500/80 rounded-xl p-6 text-center cursor-pointer bg-dark-950/40 hover:bg-dark-950/80 transition group"
            >
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-brand-400 mx-auto mb-2 transition" />
              <div className="font-semibold text-white text-xs mb-0.5">
                Click to select or drop an M3U / M3U8 file
              </div>
              <div className="text-[11px] text-slate-500">
                Supports standard and extended M3U format
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
