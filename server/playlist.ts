import { Channel, PlaylistResponse } from './types.js';

export const DEFAULT_PLAYLIST_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

interface CacheEntry {
  data: PlaylistResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function detectStreamType(url: string): Channel['type'] {
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com/') || lower.includes('youtu.be/')) {
    return 'youtube';
  }
  if (lower.includes('twitch.tv/')) {
    return 'twitch';
  }
  if (lower.includes('.m3u8') || lower.includes('/hls') || lower.includes('.smil')) {
    return 'hls';
  }
  if (lower.endsWith('.mp4') || lower.includes('.mp4?')) {
    return 'mp4';
  }
  return 'hls'; // default fallback for IPTV streams
}

export function parseM3U(content: string, sourceUrl: string): PlaylistResponse {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  const groupCounts = new Map<string, number>();

  let currentMeta: Partial<Channel> | null = null;
  let counter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      counter++;
      const nameMatch = line.match(/tvg-name="([^"]*)"/i);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const idMatch = line.match(/tvg-id="([^"]*)"/i);
      const countryMatch = line.match(/tvg-country="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);

      const commaIdx = line.lastIndexOf(',');
      const rawTitle = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : '';

      const name = (nameMatch && nameMatch[1].trim()) || rawTitle || `Channel ${counter}`;
      const group = (groupMatch && groupMatch[1].trim()) || 'General';
      const country = (countryMatch && countryMatch[1].trim()) || '';
      const logo = (logoMatch && logoMatch[1].trim()) || '';
      const id = (idMatch && idMatch[1].trim()) || `ch-${counter}`;

      currentMeta = {
        id: `${id}-${counter}`,
        name,
        logo,
        country,
        group,
      };
    } else if (!line.startsWith('#') && currentMeta) {
      const url = line;
      const type = detectStreamType(url);

      const channel: Channel = {
        id: currentMeta.id || `ch-${counter}`,
        name: currentMeta.name || `Channel ${counter}`,
        logo: currentMeta.logo || '',
        country: currentMeta.country || '',
        group: currentMeta.group || 'General',
        url,
        type,
      };

      channels.push(channel);
      groupCounts.set(channel.group, (groupCounts.get(channel.group) || 0) + 1);
      currentMeta = null;
    }
  }

  const groups = Array.from(groupCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    url: sourceUrl,
    totalChannels: channels.length,
    groups,
    channels,
    fetchedAt: Date.now(),
  };
}

export async function fetchPlaylist(url: string = DEFAULT_PLAYLIST_URL, forceReload = false): Promise<PlaylistResponse> {
  const cached = cache.get(url);
  const now = Date.now();

  if (!forceReload && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch playlist: ${res.status} ${res.statusText}`);
  }

  const content = await res.text();
  const parsed = parseM3U(content, url);

  cache.set(url, {
    data: parsed,
    timestamp: now,
  });

  return parsed;
}
