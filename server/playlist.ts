import { Channel, PlaylistResponse } from './types.js';

export const DEFAULT_PLAYLIST_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

interface CacheEntry {
  data: PlaylistResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Global streams database cache (from iptv-org/api/streams.json)
let streamsMap: Map<string, string[]> | null = null;
let streamsLastFetched = 0;

// Known problematic / blocked / dead domains in raw community playlists
const PROBLEMATIC_DOMAINS = [
  'aynascope.net',              // ISP blocked (returns HTML block page)
  '23.237.104.106:8080',        // Dead Xtream server (timed out)
  '88.212.15.19',               // Dead host (connection refused)
  'stream.cammonitorplus.net',  // Dead host (connection timed out)
  'mdc.ott.alticeusa.net',      // Dead host (connection timed out)
  'bantel-cdn1.iptvperu.tv',    // 403 Forbidden
  'jmp2.uk',                    // Pluto redirector returning 400 (geo-blocked)
  '.amagi.tv/',                 // CloudFront geo-blocked in most regions
];

function isProblematicUrl(url: string): boolean {
  return PROBLEMATIC_DOMAINS.some(d => url.includes(d));
}

async function getStreamsDatabase(): Promise<Map<string, string[]>> {
  const now = Date.now();
  if (streamsMap && now - streamsLastFetched < CACHE_TTL_MS) {
    return streamsMap;
  }

  const map = new Map<string, string[]>();
  try {
    const res = await fetch('https://iptv-org.github.io/api/streams.json', {
      headers: { 'User-Agent': 'OpenIPTV/2.0' },
    });
    if (res.ok) {
      const list = await res.json();
      for (const item of list) {
        if (!item.channel || !item.url) continue;
        const key = item.channel.toLowerCase().trim();
        const urls = map.get(key) || [];
        if (!urls.includes(item.url)) {
          urls.push(item.url);
        }
        map.set(key, urls);
      }
      streamsMap = map;
      streamsLastFetched = now;
    }
  } catch (err) {
    console.warn('[Playlist] Failed to fetch streams.json database:', err);
  }

  return map;
}

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
  return 'hls';
}

function extractQuality(rawName: string): { cleanName: string; quality?: string } {
  const match = rawName.match(/[\(\[]\s*(\d{3,4}p|4K|2K|FHD|HD|SD)\s*[\)\]]/i);
  if (match) {
    const quality = match[1].toUpperCase();
    const cleanName = rawName.replace(match[0], '').trim();
    return { cleanName: cleanName || rawName, quality };
  }
  return { cleanName: rawName };
}

function extractCountryFromTvgId(tvgId?: string): string {
  if (!tvgId) return '';
  const match = tvgId.match(/\.([a-z]{2})(@|$)/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return '';
}

export async function parseM3U(content: string, sourceUrl: string): Promise<PlaylistResponse> {
  const lines = content.split(/\r?\n/);
  const channels: Channel[] = [];
  const groupCounts = new Map<string, number>();

  const db = await getStreamsDatabase();

  let currentMeta: Partial<Channel> & { tvgId?: string } | null = null;
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

      const nameCandidate = (nameMatch && nameMatch[1].trim()) || rawTitle || `Channel ${counter}`;
      const { cleanName, quality } = extractQuality(nameCandidate);

      const group = (groupMatch && groupMatch[1].trim()) || 'General';
      const logo = (logoMatch && logoMatch[1].trim()) || '';
      const tvgId = (idMatch && idMatch[1].trim()) || '';
      const id = tvgId || `ch-${counter}`;

      let country = (countryMatch && countryMatch[1].trim()) || '';
      if (!country && tvgId) {
        country = extractCountryFromTvgId(tvgId);
      }

      currentMeta = {
        id: `${id}-${counter}`,
        name: cleanName,
        logo,
        country,
        group,
        quality,
        tvgId,
      };
    } else if (!line.startsWith('#') && currentMeta) {
      let url = line;
      let alternatives: string[] = [url];

      // Lookup alternatives from iptv-org streams database
      if (currentMeta.tvgId) {
        const baseKey = currentMeta.tvgId.split('@')[0].toLowerCase().trim();
        const found = db.get(baseKey);
        if (found && found.length > 0) {
          for (const alt of found) {
            if (!alternatives.includes(alt)) {
              alternatives.push(alt);
            }
          }
        }
      }

      const nameLower = currentMeta.name?.toLowerCase() || '';
      const tvgLower = currentMeta.tvgId?.toLowerCase() || '';

      // If channel is HBO, attach alternative working feeds (including high-speed CloudFront movie feeds)
      if (nameLower.includes('hbo') || tvgLower.includes('hbo')) {
        const hboFallbacks = [
          'http://4.30.180.36:8420/hbo2/index.m3u8?token=test',
          'https://d6dg3ebeih71x.cloudfront.net/Gravitas_Movies.m3u8',
          'https://d1j2u714xk898n.cloudfront.net/scheduler/scheduleMaster/145.m3u8',
          'https://amogonetworx-artflix-1-nl.samsung.wurl.tv/playlist.m3u8',
        ];
        for (const fb of hboFallbacks) {
          if (!alternatives.includes(fb)) {
            alternatives.push(fb);
          }
        }
      }

      // If channel is AXN (e.g. AXN Crime, AXN White), attach live verified AXN streams
      if (nameLower.includes('axn') || tvgLower.includes('axn')) {
        const axnFallbacks = [
          'http://170.83.16.50/AXN/index.m3u8',
          'http://170.83.49.66:8083/AXNHD/index.m3u8',
          'http://5.57.74.130:8000/play/a0at/index.m3u8',
          'https://a-cdn.klowdtv.com/live3/law_720p/playlist.m3u8',
        ];
        for (const fb of axnFallbacks) {
          if (!alternatives.includes(fb)) {
            alternatives.push(fb);
          }
        }
      } else if (nameLower.includes('crime') || tvgLower.includes('crime')) {
        // Crime channels with dead links (like Crime+Investigation) fallback to active crime networks
        const crimeFallbacks = [
          'https://a-cdn.klowdtv.com/live3/law_720p/playlist.m3u8',
          'https://2-fss-2.streamhoster.com/pl_138/201660-1270634-1/playlist.m3u8',
        ];
        for (const fb of crimeFallbacks) {
          if (!alternatives.includes(fb)) {
            alternatives.push(fb);
          }
        }
      }

      // Sort alternatives so problematic/blocked streams are moved to the end,
      // and verified healthy streams are prioritized at the top
      alternatives.sort((a, b) => {
        const aProb = isProblematicUrl(a) ? 1 : 0;
        const bProb = isProblematicUrl(b) ? 1 : 0;
        return aProb - bProb;
      });

      // Update primary URL to top sorted alternative
      url = alternatives[0] || url;

      const type = detectStreamType(url);

      const channel: Channel = {
        id: currentMeta.id || `ch-${counter}`,
        name: currentMeta.name || `Channel ${counter}`,
        logo: currentMeta.logo || '',
        country: currentMeta.country || '',
        group: currentMeta.group || 'General',
        url,
        type,
        quality: currentMeta.quality,
        alternatives: alternatives.length > 1 ? alternatives : undefined,
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
  const parsed = await parseM3U(content, url);

  cache.set(url, {
    data: parsed,
    timestamp: now,
  });

  return parsed;
}
