import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AspectRatio, Channel, StreamingMode } from '../types';
import { useHlsPlayer } from '../hooks/useHlsPlayer';
import { PlayerControls } from './PlayerControls';
import { StatsOverlay } from './StatsOverlay';
import {
  Tv,
  AlertTriangle,
  RotateCw,
  ShieldAlert,
  Loader2,
  SkipForward,
  SkipBack,
  Youtube,
  Radio,
  ExternalLink,
  Maximize,
  Minimize,
} from 'lucide-react';

interface VideoPlayerProps {
  channel: Channel | null;
  streamingMode: StreamingMode;
  audioBoost: boolean;
  aspectRatio: AspectRatio;
  lowLatency: boolean;
  autoPlay: boolean;
  onPrevChannel: () => void;
  onNextChannel: () => void;
  onChangeAspectRatio: (ratio: AspectRatio) => void;
  onToggleAudioBoost: () => void;
  onSwitchToProxyMode?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  channel,
  streamingMode,
  audioBoost,
  aspectRatio,
  lowLatency,
  autoPlay,
  onPrevChannel,
  onNextChannel,
  onChangeAspectRatio,
  onToggleAudioBoost,
  onSwitchToProxyMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  // YouTube live resolution states
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const [isResolvingYt, setIsResolvingYt] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);

  const streamUrl = channel?.type !== 'youtube' && channel?.type !== 'twitch' ? channel?.url || '' : '';

  const {
    videoRef,
    isPlaying,
    isBuffering,
    volume,
    isMuted,
    error,
    qualityLevels,
    currentLevel,
    stats,
    activeUrl,
    isUsingProxy,
    togglePlay,
    toggleMute,
    changeVolume,
    changeLevel,
    retryStream,
  } = useHlsPlayer({
    streamUrl,
    streamingMode,
    audioBoost,
    lowLatency,
    autoPlay,
  });

  // Resolve YouTube live stream ID
  useEffect(() => {
    if (!channel || channel.type !== 'youtube') {
      setYtVideoId(null);
      setYtError(null);
      setIsResolvingYt(false);
      return;
    }

    // 1. Direct watch URL (youtube.com/watch?v=...)
    try {
      const parsed = new URL(channel.url);
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        setYtVideoId(v);
        setYtError(null);
        setIsResolvingYt(false);
        return;
      }
      if (parsed.hostname === 'youtu.be') {
        const id = parsed.pathname.slice(1);
        if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
          setYtVideoId(id);
          setYtError(null);
          setIsResolvingYt(false);
          return;
        }
      }
    } catch {
      // Ignore
    }

    // 2. Live Channel URL (/c/..., /@..., /live, etc.) -> resolve via backend
    setIsResolvingYt(true);
    setYtError(null);
    setYtVideoId(null);

    const controller = new AbortController();

    fetch(`/api/resolve?url=${encodeURIComponent(channel.url)}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.videoId) {
          setYtVideoId(data.videoId);
          setYtError(null);
        } else {
          setYtError('No live broadcast is currently running on this YouTube channel.');
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setYtError('Failed to resolve live broadcast for this channel.');
      })
      .finally(() => {
        setIsResolvingYt(false);
      });

    return () => controller.abort();
  }, [channel]);

  // Handle Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(console.warn);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.warn);
      setIsFullscreen(false);
    }
  }, []);

  // Handle PiP
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video !== document.pictureInPictureElement) {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error:', e);
    }
  }, [videoRef]);

  // Track fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Controls auto-hide logic
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (isPlaying && !error) {
      hideControlsTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying && !error) {
      setShowControls(false);
    }
  };

  // Helper for Twitch embeds
  const getTwitchEmbedUrl = (url: string) => {
    try {
      const parts = new URL(url).pathname.split('/').filter(Boolean);
      const channelName = parts[0];
      const host = window.location.hostname || 'localhost';
      return `https://player.twitch.tv/?channel=${channelName}&parent=${host}&autoplay=true&muted=false`;
    } catch {
      return url;
    }
  };

  const getVideoClass = () => {
    switch (aspectRatio) {
      case '16:9':
        return 'w-full h-full max-h-full aspect-video object-contain';
      case '4:3':
        return 'w-full h-full max-h-full aspect-[4/3] object-contain';
      case 'fill':
        return 'w-full h-full object-fill';
      case 'cover':
        return 'w-full h-full object-cover';
      default:
        return 'w-full h-full object-contain';
    }
  };

  if (!channel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-dark-950 text-slate-400 p-8 select-none">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-dark-900 border border-slate-800 flex items-center justify-center shadow-2xl">
            <Tv className="w-12 h-12 text-brand-400/80 animate-pulse" />
          </div>
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-sky-600 rounded-3xl blur opacity-20 -z-10"></div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to OpenIPTV</h2>
        <p className="text-sm text-slate-400 max-w-md text-center mb-6">
          Select any channel from the sidebar or search by country and name to start streaming instantly.
        </p>
        <div className="flex items-center gap-3 text-xs text-slate-400 bg-dark-900/60 px-4 py-2 rounded-full border border-slate-800">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-dark-800 rounded font-mono text-slate-300">Space</kbd> to play/pause</span>
          <span>•</span>
          <span><kbd className="px-1.5 py-0.5 bg-dark-800 rounded font-mono text-slate-300">F</kbd> for fullscreen</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex-1 bg-black overflow-hidden flex items-center justify-center group ${
        !showControls && isPlaying ? 'cursor-none' : 'cursor-default'
      }`}
    >
      {/* Embedded YouTube Player */}
      {channel.type === 'youtube' && (
        <div className="w-full h-full flex flex-col relative bg-black">
          {/* Resolving Spinner */}
          {isResolvingYt && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-950 z-20">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 animate-pulse">
                <Youtube className="w-8 h-8 text-red-500" />
              </div>
              <div className="flex items-center gap-2 mb-2 text-white font-semibold text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                <span>Connecting to YouTube Live...</span>
              </div>
              <p className="text-xs text-slate-400">{channel.name}</p>
            </div>
          )}

          {/* YouTube Error Card */}
          {ytError && !isResolvingYt && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-950/95 backdrop-blur-md p-6 z-30 select-none animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <Youtube className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">YouTube Live Stream Inactive</h3>
              <p className="text-xs text-slate-400 max-w-sm text-center mb-6">{ytError}</p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={channel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-600/20 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Channel on YouTube
                </a>

                <button
                  onClick={onNextChannel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Next Channel
                </button>
              </div>
            </div>
          )}

          {/* Active YouTube Embed */}
          {ytVideoId && !isResolvingYt && (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=1&mute=0&playsinline=1&rel=0&enablejsapi=1`}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={channel.name}
            />
          )}

          {/* Floating YouTube Channel HUD Overlay */}
          <div className="absolute top-3 inset-x-4 flex items-center justify-between pointer-events-none z-30 transition-opacity duration-300 opacity-90 hover:opacity-100">
            <div className="flex items-center gap-2 bg-dark-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto shadow-lg">
              <button
                onClick={onPrevChannel}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition"
                title="Previous Channel ([)"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-slate-700"></span>
              <button
                onClick={onNextChannel}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition"
                title="Next Channel (])"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 pl-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold text-white max-w-[180px] truncate">
                  {channel.name}
                </span>
                <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-1.5 py-0.2 rounded uppercase">
                  YouTube Live
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-900/90 backdrop-blur-md border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition shadow-lg"
                title="Open on YouTube website"
              >
                <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">YouTube</span>
              </a>

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-dark-900/90 backdrop-blur-md border border-slate-800 rounded-xl text-slate-300 hover:text-white transition shadow-lg"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Twitch Player */}
      {channel.type === 'twitch' && (
        <div className="w-full h-full flex flex-col relative bg-black">
          <iframe
            src={getTwitchEmbedUrl(channel.url)}
            className="w-full h-full border-0"
            allowFullScreen
            title={channel.name}
          />

          {/* Floating Twitch Channel HUD Overlay */}
          <div className="absolute top-3 inset-x-4 flex items-center justify-between pointer-events-none z-30 transition-opacity duration-300 opacity-90 hover:opacity-100">
            <div className="flex items-center gap-2 bg-dark-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 pointer-events-auto shadow-lg">
              <button
                onClick={onPrevChannel}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition"
                title="Previous Channel ([)"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <span className="w-px h-4 bg-slate-700"></span>
              <button
                onClick={onNextChannel}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition"
                title="Next Channel (])"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 pl-2">
                <Radio className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white max-w-[180px] truncate">
                  {channel.name}
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-400 font-bold px-1.5 py-0.2 rounded uppercase">
                  Twitch Live
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-dark-900/90 backdrop-blur-md border border-slate-800 rounded-xl text-slate-300 hover:text-white transition shadow-lg"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard HLS / HTML5 Video Stream */}
      {channel.type !== 'youtube' && channel.type !== 'twitch' && (
        <>
          <video
            ref={videoRef}
            playsInline
            className={getVideoClass()}
            onClick={togglePlay}
          />

          {/* Buffering Spinner */}
          {isBuffering && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none z-20">
              <Loader2 className="w-12 h-12 text-brand-400 animate-spin mb-3 drop-shadow-md" />
              <span className="text-xs font-semibold text-slate-200 tracking-wider uppercase">
                Buffering Channel...
              </span>
            </div>
          )}

          {/* Stream Error Alert Card */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-950/90 backdrop-blur-md p-6 z-30 select-none animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Stream Playback Failed</h3>
              <p className="text-xs text-slate-400 max-w-sm text-center mb-6">{error}</p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => retryStream(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Retry Direct
                </button>

                <button
                  onClick={() => {
                    retryStream(true);
                    onSwitchToProxyMode?.();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-dark-950 text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Bypass with Proxy
                </button>

                <button
                  onClick={onNextChannel}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Next Channel
                </button>
              </div>
            </div>
          )}

          {/* Stats Overlay ("Stats for Nerds") */}
          {showStats && (
            <StatsOverlay
              stats={stats}
              isUsingProxy={isUsingProxy}
              activeUrl={activeUrl}
              onClose={() => setShowStats(false)}
            />
          )}

          {/* Player HUD Controls */}
          <div
            className={`transition-opacity duration-300 ${
              showControls || !isPlaying || error ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <PlayerControls
              channel={channel}
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              volume={volume}
              isMuted={isMuted}
              audioBoost={audioBoost}
              aspectRatio={aspectRatio}
              qualityLevels={qualityLevels}
              currentLevel={currentLevel}
              isFullscreen={isFullscreen}
              showStats={showStats}
              onTogglePlay={togglePlay}
              onToggleMute={toggleMute}
              onChangeVolume={changeVolume}
              onToggleAudioBoost={onToggleAudioBoost}
              onChangeAspectRatio={onChangeAspectRatio}
              onChangeQuality={changeLevel}
              onTogglePiP={togglePiP}
              onToggleFullscreen={toggleFullscreen}
              onToggleStats={() => setShowStats(!showStats)}
              onPrevChannel={onPrevChannel}
              onNextChannel={onNextChannel}
            />
          </div>
        </>
      )}
    </div>
  );
};
