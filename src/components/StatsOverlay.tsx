import React from 'react';
import { StreamStats } from '../types';
import { X, Activity } from 'lucide-react';

interface StatsOverlayProps {
  stats: StreamStats;
  isUsingProxy: boolean;
  activeUrl: string;
  onClose: () => void;
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({
  stats,
  isUsingProxy,
  activeUrl,
  onClose,
}) => {
  return (
    <div className="absolute top-4 left-4 z-40 bg-dark-900/90 backdrop-blur-md border border-slate-700/60 rounded-xl p-4 text-xs font-mono text-slate-200 shadow-2xl max-w-sm w-full animate-fade-in pointer-events-auto">
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2 mb-3">
        <div className="flex items-center gap-2 text-brand-400 font-semibold text-sm">
          <Activity className="w-4 h-4" />
          <span>Stats for Nerds</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          title="Close Stats"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-slate-400">Resolution:</span>
          <span className="font-semibold text-white">{stats.resolution}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Bitrate:</span>
          <span>{stats.bitrate ? `${(stats.bitrate / 1000000).toFixed(2)} Mbps` : 'Adaptive'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Buffer Length:</span>
          <span className={stats.bufferLength < 2 ? 'text-amber-400' : 'text-emerald-400'}>
            {stats.bufferLength}s
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Dropped Frames:</span>
          <span className={stats.droppedFrames > 10 ? 'text-red-400' : 'text-slate-300'}>
            {stats.droppedFrames} / {stats.totalFrames}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Codec / Profile:</span>
          <span>{stats.codec}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Routing Mode:</span>
          <span className={isUsingProxy ? 'text-purple-400 font-semibold' : 'text-sky-400 font-semibold'}>
            {isUsingProxy ? 'Proxied (CORS Bypass)' : 'Direct Stream'}
          </span>
        </div>
        <div className="border-t border-slate-800 pt-2 mt-2">
          <span className="text-slate-400 block mb-1">Source URL:</span>
          <div className="text-[10px] text-slate-400 break-all bg-dark-950/80 p-1.5 rounded border border-slate-800/80 select-all">
            {activeUrl || 'None'}
          </div>
        </div>
      </div>
    </div>
  );
};
