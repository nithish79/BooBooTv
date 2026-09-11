import React, { useState } from 'react';
import { Channel } from '../types';
import { Star, Tv, Youtube, Radio } from 'lucide-react';

interface ChannelCardProps {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  viewMode: 'grid' | 'list';
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channelId: string) => void;
}

const GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-700',
  'from-amber-600 to-orange-700',
  'from-rose-600 to-pink-700',
  'from-cyan-600 to-blue-700',
];

function getDeterministicGradient(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  isActive,
  isFavorite,
  viewMode,
  onSelect,
  onToggleFavorite,
}) => {
  const [logoError, setLogoError] = useState(false);

  const initials = channel.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(channel.id);
  };

  const getChannelTypeIcon = () => {
    if (channel.type === 'youtube') {
      return <Youtube className="w-3.5 h-3.5 text-red-400" />;
    }
    if (channel.type === 'twitch') {
      return <Radio className="w-3.5 h-3.5 text-purple-400" />;
    }
    return <Tv className="w-3.5 h-3.5 text-brand-400" />;
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onSelect(channel)}
        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 group ${
          isActive
            ? 'bg-brand-500/15 border border-brand-500/40 text-white shadow-sm'
            : 'hover:bg-dark-800/80 text-slate-300 hover:text-white border border-transparent'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo / Avatar */}
          <div className="w-9 h-9 rounded-lg bg-dark-900 border border-slate-700/60 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
            {channel.logo && !logoError ? (
              <img
                src={channel.logo}
                alt={channel.name}
                onError={() => setLogoError(true)}
                className="w-full h-full object-contain p-0.5"
                loading="lazy"
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${getDeterministicGradient(
                  channel.name
                )} flex items-center justify-center font-bold text-xs text-white`}
              >
                {initials || <Tv className="w-4 h-4" />}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs truncate max-w-[170px]">
                {channel.name}
              </span>
              {channel.quality && (
                <span className="text-[9px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.2 rounded font-mono flex-shrink-0">
                  {channel.quality}
                </span>
              )}
              {isActive && (
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse flex-shrink-0"></span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="truncate max-w-[120px]">{channel.group}</span>
              {channel.country && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {channel.country}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="opacity-75 group-hover:opacity-100">{getChannelTypeIcon()}</div>
          <button
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-lg transition ${
              isFavorite
                ? 'text-amber-400 hover:text-amber-300'
                : 'text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div
      onClick={() => onSelect(channel)}
      className={`relative flex flex-col p-3 rounded-2xl cursor-pointer transition-all duration-200 group border ${
        isActive
          ? 'bg-gradient-to-b from-brand-500/20 to-dark-900 border-brand-500/60 shadow-lg shadow-brand-500/10 scale-[1.02]'
          : 'bg-dark-900/70 hover:bg-dark-850/90 border-slate-800 hover:border-slate-700 hover:scale-[1.01]'
      }`}
    >
      {/* Header: Type icon, Country, Quality, and Star */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {getChannelTypeIcon()}
          {channel.country && (
            <span className="text-[10px] bg-dark-800/80 text-slate-400 px-1.5 py-0.5 rounded font-mono font-medium">
              {channel.country}
            </span>
          )}
          {channel.quality && (
            <span className="text-[9px] bg-brand-500/20 text-brand-300 font-bold px-1.5 py-0.2 rounded font-mono">
              {channel.quality}
            </span>
          )}
        </div>
        <button
          onClick={handleFavoriteClick}
          className={`p-1 rounded-md transition ${
            isFavorite
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-slate-500 hover:text-slate-300 opacity-0 group-hover:opacity-100'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Logo container */}
      <div className="w-full h-16 rounded-xl bg-dark-950/60 border border-slate-800/60 flex items-center justify-center p-2 mb-2.5 overflow-hidden">
        {channel.logo && !logoError ? (
          <img
            src={channel.logo}
            alt={channel.name}
            onError={() => setLogoError(true)}
            className="w-full h-full object-contain filter drop-shadow"
            loading="lazy"
          />
        ) : (
          <div
            className={`w-full h-full rounded-lg bg-gradient-to-br ${getDeterministicGradient(
              channel.name
            )} flex items-center justify-center font-bold text-sm text-white tracking-wider`}
          >
            {initials || <Tv className="w-6 h-6" />}
          </div>
        )}
      </div>

      {/* Title & Group */}
      <div className="min-w-0">
        <h4
          className={`font-semibold text-xs truncate mb-0.5 ${
            isActive ? 'text-brand-300' : 'text-slate-200 group-hover:text-white'
          }`}
        >
          {channel.name}
        </h4>
        <p className="text-[11px] text-slate-400 truncate">{channel.group}</p>
      </div>

      {/* Active Indicator Ring */}
      {isActive && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
        </span>
      )}
    </div>
  );
};
