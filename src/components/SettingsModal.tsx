import React from 'react';
import { AppSettings, StreamingMode, AspectRatio } from '../types';
import { X, Shield, Sparkles, Tv, Zap, Trash2 } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearHistory: () => void;
  onClearFavorites: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
  onClearHistory,
  onClearFavorites,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-dark-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white">Player Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6 custom-scrollbar text-xs">
          {/* Streaming Mode Section */}
          <div>
            <label className="text-slate-200 font-semibold mb-1 flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-brand-400" />
              <span>Streaming & CORS Mode</span>
            </label>
            <p className="text-slate-400 mb-3 text-[11px]">
              Controls how media manifests and video segments are fetched from global stream servers.
            </p>

            <div className="space-y-2">
              {[
                {
                  id: 'auto' as StreamingMode,
                  title: 'Smart Auto-Fallback (Recommended)',
                  desc: 'Plays directly for lowest latency; automatically falls back to local proxy if CORS or network error occurs.',
                },
                {
                  id: 'proxy' as StreamingMode,
                  title: 'Always Proxy (Bypass All CORS & ISP Blocks)',
                  desc: 'Routes all requests through the built-in streaming proxy. Guaranteed compatibility for protected streams.',
                },
                {
                  id: 'direct' as StreamingMode,
                  title: 'Direct Stream Only',
                  desc: 'Attempts direct connections only. Some streams without CORS headers may fail.',
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => onUpdateSettings({ streamingMode: opt.id })}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    settings.streamingMode === opt.id
                      ? 'bg-brand-500/15 border-brand-500/60 text-white'
                      : 'bg-dark-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="streamingMode"
                    checked={settings.streamingMode === opt.id}
                    onChange={() => onUpdateSettings({ streamingMode: opt.id })}
                    className="mt-0.5 accent-brand-400"
                  />
                  <div>
                    <div className="font-semibold text-xs text-white">{opt.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audio Booster & Low Latency */}
          <div className="space-y-3 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-semibold text-white">200% Audio Booster</div>
                  <div className="text-[11px] text-slate-400">
                    Boost quiet streams past normal 100% volume using Web Audio API.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.audioBoost}
                onChange={(e) => onUpdateSettings({ audioBoost: e.target.checked })}
                className="w-4 h-4 rounded accent-brand-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">Low Latency Mode</div>
                  <div className="text-[11px] text-slate-400">
                    Syncs closer to the live broadcast edge (reduces broadcast delay).
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.lowLatency}
                onChange={(e) => onUpdateSettings({ lowLatency: e.target.checked })}
                className="w-4 h-4 rounded accent-brand-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-dark-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Tv className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-semibold text-white">Auto-Play on Channel Select</div>
                  <div className="text-[11px] text-slate-400">
                    Immediately start playing when clicking a channel card.
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) => onUpdateSettings({ autoPlay: e.target.checked })}
                className="w-4 h-4 rounded accent-brand-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Default Aspect Ratio */}
          <div className="border-t border-slate-800/80 pt-4">
            <label className="text-slate-200 font-semibold mb-2 block text-xs">
              Default Aspect Ratio
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['16:9', '4:3', 'fill', 'cover'] as AspectRatio[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onUpdateSettings({ aspectRatio: r })}
                  className={`py-2 text-center rounded-xl border text-xs font-semibold capitalize transition ${
                    settings.aspectRatio === r
                      ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                      : 'bg-dark-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Data Cleanup */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <div className="text-slate-200 font-semibold text-xs mb-1">Local Storage</div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (confirm('Clear recently watched channel history?')) {
                    onClearHistory();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-dark-950/80 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear History
              </button>

              <button
                onClick={() => {
                  if (confirm('Clear all starred favorites?')) {
                    onClearFavorites();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-dark-950/80 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 transition text-xs font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Favorites
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-dark-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-400 text-dark-950 font-bold text-xs rounded-xl shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
