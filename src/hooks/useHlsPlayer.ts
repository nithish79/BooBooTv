import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { QualityLevel, StreamStats, StreamingMode } from '../types';

interface UseHlsPlayerProps {
  streamUrl: string;
  alternatives?: string[];
  streamingMode: StreamingMode;
  audioBoost: boolean;
  lowLatency: boolean;
  autoPlay: boolean;
}

export function useHlsPlayer({
  streamUrl,
  alternatives = [],
  streamingMode,
  audioBoost,
  lowLatency,
  autoPlay,
}: UseHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Audio Context for Volume Booster (>100%)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is Auto
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [isUsingProxy, setIsUsingProxy] = useState(false);

  // Active alternative stream index
  const [sourceIndex, setSourceIndex] = useState(0);

  // Combined sources list
  const allSources = alternatives.length > 0 ? alternatives : (streamUrl ? [streamUrl] : []);

  const [stats, setStats] = useState<StreamStats>({
    resolution: 'Loading...',
    bitrate: 0,
    bufferLength: 0,
    droppedFrames: 0,
    totalFrames: 0,
    codec: 'Auto',
    latency: 0,
  });

  // Calculate playback URL based on mode and fallback
  const getPlayableUrl = useCallback((rawUrl: string, forceProxy: boolean) => {
    if (!rawUrl) return '';
    if (forceProxy || streamingMode === 'proxy') {
      return `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
    }
    return rawUrl;
  }, [streamingMode]);

  // Setup Web Audio booster
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const gain = ctx.createGain();
          const source = ctx.createMediaElementSource(video);
          source.connect(gain);
          gain.connect(ctx.destination);

          audioCtxRef.current = ctx;
          gainNodeRef.current = gain;
          sourceNodeRef.current = source;
        }
      }
    } catch (e) {
      console.warn('Web Audio Booster not supported or already attached:', e);
    }
  }, []);

  // Update volume & booster
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = Math.min(1, Math.max(0, volume));
    video.muted = isMuted;

    if (gainNodeRef.current && audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      gainNodeRef.current.gain.value = audioBoost && volume > 0.9 ? 1.8 : 1.0;
    }
  }, [volume, isMuted, audioBoost]);

  // Reset source index on streamUrl change
  useEffect(() => {
    setSourceIndex(0);
  }, [streamUrl]);

  // Main HLS Loader
  useEffect(() => {
    const video = videoRef.current;
    const currentTargetUrl = allSources[sourceIndex] || streamUrl;
    if (!video || !currentTargetUrl) return;

    let retryCount = 0;
    let fallbackToProxy = streamingMode === 'proxy';
    let urlToPlay = getPlayableUrl(currentTargetUrl, fallbackToProxy);

    setIsUsingProxy(fallbackToProxy);
    setActiveUrl(urlToPlay);
    setError(null);
    setIsBuffering(true);
    setQualityLevels([]);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const initHls = (targetUrl: string) => {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: lowLatency,
          // Robust buffer settings tuned to avoid rate-limiting and buffer starvation
          liveSyncDurationCount: lowLatency ? 2 : 3,
          liveMaxLatencyDurationCount: lowLatency ? 5 : 8,
          maxBufferLength: 20,
          maxMaxBufferLength: 40,
          maxBufferSize: 30 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.2,
          nudgeMaxRetry: 5,
          manifestLoadingTimeOut: 8000,
          manifestLoadingMaxRetry: 2,
          manifestLoadingRetryDelay: 500,
          levelLoadingTimeOut: 8000,
          levelLoadingMaxRetry: 2,
          fragLoadingTimeOut: 8000,
          fragLoadingMaxRetry: 2,
          fragLoadingRetryDelay: 500,
          fragLoadingMaxRetryTimeout: 12000,
        });

        hlsRef.current = hls;

        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          hls.loadSource(targetUrl);
        });

        let consecutiveFragErrors = 0;

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setIsBuffering(false);
          setError(null);

          const levels: QualityLevel[] = data.levels.map((lvl, index) => ({
            id: index,
            height: lvl.height,
            bitrate: lvl.bitrate,
            name: lvl.height ? `${lvl.height}p` : `Level ${index + 1}`,
          }));

          setQualityLevels(levels);

          if (autoPlay) {
            video.play().catch(() => {
              video.muted = true;
              setIsMuted(true);
              video.play().catch(console.warn);
            });
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          setCurrentLevel(data.level);
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          consecutiveFragErrors = 0;
          setIsBuffering(false);
        });

        hls.on(Hls.Events.BUFFER_STALLED_ERROR, () => {
          console.info('[HLS] Buffer stalled, nudging playback...');
          if (video && video.buffered.length > 0) {
            video.currentTime += 0.15;
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          console.warn('[HLS Event Error]:', data.type, data.details, data.fatal);

          // Track fragment loading errors even when non-fatal (upstream cutoff / 403 / anti-leech)
          if (
            data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR ||
            data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT
          ) {
            consecutiveFragErrors++;
            console.warn(`[HLS] Fragment load failure #${consecutiveFragErrors}`);

            // If 2 consecutive fragments fail, upstream server has throttled or died
            if (consecutiveFragErrors >= 2) {
              consecutiveFragErrors = 0;
              if (allSources.length > 1 && sourceIndex < allSources.length - 1) {
                console.info(`[HLS] Upstream stream halted. Fast failover to Source ${sourceIndex + 2}...`);
                setSourceIndex((prev) => prev + 1);
                return;
              } else {
                setIsBuffering(false);
                setError('Stream throttled or restricted by upstream server (rate-limit / ISP block). Try another source or movie channel.');
                hls.stopLoad();
                return;
              }
            }
          }

          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Step 1: If direct stream failed and mode is auto, try proxy fallback
                if (streamingMode === 'auto' && !fallbackToProxy) {
                  console.info('[HLS] Direct stream error. Switching to Proxy mode...');
                  fallbackToProxy = true;
                  setIsUsingProxy(true);
                  const proxyUrl = getPlayableUrl(currentTargetUrl, true);
                  setActiveUrl(proxyUrl);
                  hls.destroy();
                  initHls(proxyUrl);
                  return;
                }

                // Step 2: If alternative stream available, failover to next source
                if (allSources.length > 1 && sourceIndex < allSources.length - 1) {
                  console.info(`[HLS] Source ${sourceIndex + 1} failed. Failing over to alternative source ${sourceIndex + 2}...`);
                  setSourceIndex((prev) => prev + 1);
                  return;
                }

                if (retryCount < 1) {
                  retryCount++;
                  console.info(`[HLS] Retrying stream (${retryCount}/1)...`);
                  hls.startLoad();
                } else {
                  setError('Stream unavailable or geo-blocked. Try switching sources or proxy mode.');
                  setIsBuffering(false);
                  hls.destroy();
                }
                break;

              case Hls.ErrorTypes.MEDIA_ERROR:
                console.info('[HLS] Media decode error, attempting recovery...');
                hls.recoverMediaError();
                break;

              default:
                // If other sources exist, failover
                if (allSources.length > 1 && sourceIndex < allSources.length - 1) {
                  setSourceIndex((prev) => prev + 1);
                  return;
                }
                setError('Playback error occurred.');
                setIsBuffering(false);
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native Safari HLS
        video.src = targetUrl;
        if (autoPlay) {
          video.play().catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().catch(console.warn);
          });
        }
      } else {
        setError('HLS streaming is not supported in this browser.');
      }
    };

    initHls(urlToPlay);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, sourceIndex, streamingMode, lowLatency, autoPlay, getPlayableUrl]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  // Anti-stall watchdog: auto-nudges playback if video freezes on a tiny timestamp gap
  useEffect(() => {
    let lastTime = -1;
    let stallCount = 0;

    const watchdog = setInterval(() => {
      const video = videoRef.current;
      const hls = hlsRef.current;
      if (!video || !hls || video.paused || video.ended || video.readyState < 2) {
        lastTime = -1;
        stallCount = 0;
        return;
      }

      if (Math.abs(video.currentTime - lastTime) < 0.05) {
        stallCount++;
        // If frozen for 2.4 seconds
        if (stallCount >= 2) {
          console.warn('[HLS Anti-Stall] Detected freeze at', video.currentTime, '- checking buffer...');

          if (video.buffered.length > 0) {
            const bufferEnd = video.buffered.end(video.buffered.length - 1);
            if (bufferEnd > video.currentTime + 0.2) {
              video.currentTime += 0.2;
              stallCount = 0;
              return;
            }
          }

          // If frozen with zero buffer for 4+ ticks (~4.8 seconds), auto-failover to next source
          if (stallCount >= 4) {
            stallCount = 0;
            if (allSources.length > 1 && sourceIndex < allSources.length - 1) {
              console.warn('[HLS Anti-Stall] Stream starved of data. Auto-switching to next source...');
              setSourceIndex((prev) => prev + 1);
              return;
            }
          }

          if (hls.liveSyncPosition) {
            video.currentTime = hls.liveSyncPosition;
          }
          hls.startLoad();
        }
      } else {
        stallCount = 0;
        lastTime = video.currentTime;
      }
    }, 1200);

    return () => clearInterval(watchdog);
  }, [allSources, sourceIndex]);

  // Real-time Stats polling (every 1 sec)
  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      const hls = hlsRef.current;
      if (!video) return;

      let resolution = 'Unknown';
      if (video.videoWidth && video.videoHeight) {
        resolution = `${video.videoWidth}x${video.videoHeight}`;
      }

      let bufferLen = 0;
      if (video.buffered.length > 0) {
        try {
          bufferLen = Math.max(0, video.buffered.end(video.buffered.length - 1) - video.currentTime);
        } catch (e) {
          // Ignore
        }
      }

      let dropped = 0;
      let total = 0;
      if (typeof video.getVideoPlaybackQuality === 'function') {
        const quality = video.getVideoPlaybackQuality();
        dropped = quality.droppedVideoFrames;
        total = quality.totalVideoFrames;
      }

      let bitrate = 0;
      let codec = 'H.264 / AAC';
      if (hls && hls.levels && hls.currentLevel >= 0) {
        const level = hls.levels[hls.currentLevel];
        if (level) {
          bitrate = level.bitrate;
          if (level.codecSet) codec = level.codecSet;
        }
      }

      setStats({
        resolution,
        bitrate,
        bufferLength: Number(bufferLen.toFixed(1)),
        droppedFrames: dropped,
        totalFrames: total,
        codec,
        latency: 0,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(console.warn);
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const changeVolume = useCallback((newVol: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.min(1, Math.max(0, newVol));
    video.volume = clamped;
    setVolume(clamped);
    if (clamped > 0 && video.muted) {
      video.muted = false;
      setIsMuted(false);
    }
  }, []);

  const changeLevel = useCallback((levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setCurrentLevel(levelIndex);
    }
  }, []);

  const switchSource = useCallback((index: number) => {
    if (index >= 0 && index < allSources.length) {
      setSourceIndex(index);
    }
  }, [allSources.length]);

  const retryStream = useCallback((useProxy = false) => {
    if (!videoRef.current) return;
    const target = allSources[sourceIndex] || streamUrl;
    if (!target) return;

    setError(null);
    setIsBuffering(true);
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const url = getPlayableUrl(target, useProxy);
    setIsUsingProxy(useProxy);
    setActiveUrl(url);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: lowLatency,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
      });
      hlsRef.current = hls;
      hls.attachMedia(videoRef.current);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(url);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(console.warn);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setError('Failed to load stream after retry.');
          setIsBuffering(false);
          hls.destroy();
        }
      });
    }
  }, [allSources, sourceIndex, streamUrl, lowLatency, getPlayableUrl]);

  return {
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
    sources: allSources,
    currentSourceIndex: sourceIndex,
    switchSource,
    togglePlay,
    toggleMute,
    changeVolume,
    changeLevel,
    retryStream,
  };
}
