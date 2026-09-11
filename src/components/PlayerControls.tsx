import React, { useState } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  PictureInPicture2,
  SkipBack,
  SkipForward,
  Activity,
  Sliders,
  Sparkles,
  Tv,
} from 'lucide-react';
import { AspectRatio, Channel, QualityLevel } from '../types';

interface PlayerControlsProps {
  channel: Channel | null;
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  isMuted: boolean;
  audioBoost: boolean;
  aspectRatio: AspectRatio;
  qualityLevels: QualityLevel[];
  currentLevel: number;
  isFullscreen: boolean;
  showStats: boolean;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onChangeVolume: (vol: number) => void;
  onToggleAudioBoost: () => void;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  onChangeQuality: (level: number) => void;
  onTogglePiP: () => void;
  onToggleFullscreen: () => void;
  onToggleStats: () => void;
  onPrevChannel: () => void;
  onNextChannel: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  channel,
  isPlaying,
  isBuffering,
  volume,
  isMuted,
  audioBoost,
  aspectRatio,
  qualityLevels,
  currentLevel,
  isFullscreen,
  showStats,
  onTogglePlay,
  onToggleMute,
  onChangeVolume,
  onToggleAudioBoost,
  onChangeAspectRatio,
  onChangeQuality,
  onTogglePiP,
  onToggleFullscreen,
  onToggleStats,
  onPrevChannel,
  onNextChannel,
}) => {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showAspectMenu, setShowAspectMenu] = useState(false);

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    if (volume < 0.5) return <Volume1 className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
  };

  const getAspectRatioLabel = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return '16:9';
      case '4:3': return '4:3';
      case 'fill': return 'Stretch';
      case 'cover': return 'Zoom';
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark-950/95 via-dark-950/70 to-transparent p-4 pt-12 flex flex-col gap-3 transition-opacity duration-300 pointer-events-auto select-none">
      <div className="flex items-center justify-between">
        {/* Left: Channel Info & Basic Playback */}
        <div className="flex items-center gap-4">
          {/* Channel zap buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevChannel}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Previous Channel ([)"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={onTogglePlay}
              className="p-3 bg-brand-500 hover:bg-brand-400 text-dark-950 rounded-full font-bold shadow-lg shadow-brand-500/20 hover:scale-105 active:scale-95 transition"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={onNextChannel}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Next Channel (])"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Volume with hover slider */}
          <div
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              onClick={onToggleMute}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {getVolumeIcon()}
            </button>

            {showVolumeSlider && (
              <div className="flex items-center gap-2 bg-dark-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-xl ml-1 animate-fade-in">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                  className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-400"
                />
                <span className="text-xs font-mono text-slate-300 w-7 text-right">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
                <button
                  onClick={onToggleAudioBoost}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                    audioBoost
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'text-slate-400 hover:text-white border border-slate-700'
                  }`}
                  title="Toggle 180% Volume Booster"
                >
                  <span className="flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> Boost
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Channel Name & Live Badge */}
          {channel && (
            <div className="flex items-center gap-2.5 border-l border-slate-700/60 pl-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-red-400">LIVE</span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm truncate max-w-[200px] md:max-w-xs">
                    {channel.name}
                  </span>
                  {channel.country && (
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase">
                      {channel.country}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  {channel.group}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Stream Settings, Ratio, PiP, Fullscreen */}
        <div className="flex items-center gap-1.5">
          {/* Quality Switcher */}
          {qualityLevels.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowQualityMenu(!showQualityMenu)}
                className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-dark-800/80 hover:bg-dark-700/80 rounded-lg border border-slate-700/60 transition flex items-center gap-1.5"
                title="Stream Quality"
              >
                <Sliders className="w-3.5 h-3.5 text-brand-400" />
                <span>
                  {currentLevel === -1
                    ? 'Auto'
                    : qualityLevels[currentLevel]?.name || 'Auto'}
                </span>
              </button>

              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-dark-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl min-w-[120px] z-50">
                  <button
                    onClick={() => {
                      onChangeQuality(-1);
                      setShowQualityMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition ${
                      currentLevel === -1
                        ? 'bg-brand-500/20 text-brand-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Auto (Adaptive)
                  </button>
                  {qualityLevels.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => {
                        onChangeQuality(lvl.id);
                        setShowQualityMenu(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition ${
                        currentLevel === lvl.id
                          ? 'bg-brand-500/20 text-brand-400 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {lvl.name} {lvl.bitrate ? `(${(lvl.bitrate / 1000000).toFixed(1)}M)` : ''}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aspect Ratio Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowAspectMenu(!showAspectMenu)}
              className="px-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-dark-800/80 hover:bg-dark-700/80 rounded-lg border border-slate-700/60 transition flex items-center gap-1"
              title="Aspect Ratio"
            >
              <Tv className="w-3.5 h-3.5 text-brand-400" />
              <span>{getAspectRatioLabel(aspectRatio)}</span>
            </button>

            {showAspectMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-dark-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-2xl min-w-[100px] z-50">
                {(['16:9', '4:3', 'fill', 'cover'] as AspectRatio[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onChangeAspectRatio(r);
                      setShowAspectMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition capitalize ${
                      aspectRatio === r
                        ? 'bg-brand-500/20 text-brand-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {getAspectRatioLabel(r)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats for nerds toggle */}
          <button
            onClick={onToggleStats}
            className={`p-2 rounded-lg transition ${
              showStats
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/40'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Stats for Nerds"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Picture-in-Picture */}
          <button
            onClick={onTogglePiP}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Picture-in-Picture (P)"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Fullscreen (F)"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
