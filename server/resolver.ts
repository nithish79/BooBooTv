interface CachedVideo {
  videoId: string | null;
  timestamp: number;
}

const cache = new Map<string, CachedVideo>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export async function resolveYouTubeVideoId(url: string): Promise<{ videoId: string | null; cached?: boolean }> {
  // 1. Direct watch URL: youtube.com/watch?v=ID
  try {
    const parsed = new URL(url);
    const directId = parsed.searchParams.get('v');
    if (directId && /^[a-zA-Z0-9_-]{11}$/.test(directId)) {
      return { videoId: directId };
    }

    // 2. Short URL: youtu.be/ID
    if (parsed.hostname === 'youtu.be') {
      const shortId = parsed.pathname.slice(1);
      if (/^[a-zA-Z0-9_-]{11}$/.test(shortId)) {
        return { videoId: shortId };
      }
    }
  } catch {
    // Ignore URL parse error
  }

  // Check cache
  const cached = cache.get(url);
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { videoId: cached.videoId, cached: true };
  }

  // 3. Channel or Live URL: fetch page to parse active live stream ID
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!res.ok) {
      return { videoId: null };
    }

    const html = await res.text();

    // Strategy A: Canonical link <link rel="canonical" href="https://www.youtube.com/watch?v=...">
    const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
    if (canonicalMatch) {
      const vid = canonicalMatch[1];
      cache.set(url, { videoId: vid, timestamp: now });
      return { videoId: vid };
    }

    // Strategy B: og:url <meta property="og:url" content="https://www.youtube.com/watch?v=...">
    const ogMatch = html.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
    if (ogMatch) {
      const vid = ogMatch[1];
      cache.set(url, { videoId: vid, timestamp: now });
      return { videoId: vid };
    }

    // Strategy C: "videoId":"..."
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch) {
      const vid = videoIdMatch[1];
      cache.set(url, { videoId: vid, timestamp: now });
      return { videoId: vid };
    }

    // Strategy D: /watch?v=...
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      const vid = watchMatch[1];
      cache.set(url, { videoId: vid, timestamp: now });
      return { videoId: vid };
    }

    cache.set(url, { videoId: null, timestamp: now });
    return { videoId: null };
  } catch (err: any) {
    console.error(`[YouTube Resolver] Error resolving ${url}:`, err.message);
    return { videoId: null };
  }
}
