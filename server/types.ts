export interface Channel {
  id: string;
  name: string;
  logo: string;
  country: string;
  group: string;
  url: string;
  type: 'hls' | 'youtube' | 'twitch' | 'mp4' | 'other';
}

export interface PlaylistResponse {
  url: string;
  totalChannels: number;
  groups: { name: string; count: number }[];
  channels: Channel[];
  fetchedAt: number;
}
