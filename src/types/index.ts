export type StreamType = 'hls' | 'youtube' | 'twitch' | 'mp4' | 'other';

export interface Channel {
  id: string;
  name: string;
  logo: string;
  country: string;
  group: string;
  url: string;
  type: StreamType;
}

export interface GroupInfo {
  name: string;
  count: number;
}

export interface PlaylistData {
  url: string;
  totalChannels: number;
  groups: GroupInfo[];
  channels: Channel[];
  fetchedAt: number;
}

export type AspectRatio = '16:9' | '4:3' | 'fill' | 'cover';

export type StreamingMode = 'auto' | 'proxy' | 'direct';

export interface AppSettings {
  streamingMode: StreamingMode;
  audioBoost: boolean;
  aspectRatio: AspectRatio;
  lowLatency: boolean;
  autoPlay: boolean;
}

export interface QualityLevel {
  id: number;
  height: number;
  bitrate: number;
  name: string;
}

export interface StreamStats {
  resolution: string;
  bitrate: number;
  bufferLength: number;
  droppedFrames: number;
  totalFrames: number;
  codec: string;
  latency: number;
}
