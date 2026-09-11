export interface Channel {
  id: string;
  name: string;
  logo: string;
  country: string;
  group: string;
  url: string;
  type: 'hls' | 'youtube' | 'twitch' | 'mp4' | 'other';
  quality?: string;
  alternatives?: string[];
}

export interface PlaylistResponse {
  url: string;
  totalChannels: number;
  groups: { name: string; count: number }[];
  channels: Channel[];
  fetchedAt: number;
}

export interface IptvCategory {
  id: string;
  name: string;
  description?: string;
  url: string;
}

export interface IptvCountry {
  code: string;
  name: string;
  flag: string;
  languages?: string[];
  url: string;
}

export interface FeaturedPreset {
  id: string;
  name: string;
  description: string;
  badge?: string;
  url: string;
  icon: string;
}

export interface IptvOrgCatalog {
  featured: FeaturedPreset[];
  categories: IptvCategory[];
  countries: IptvCountry[];
  updatedAt: number;
}
