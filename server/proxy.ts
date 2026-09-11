import { Request, Response } from 'express';
import { Readable } from 'node:stream';

export async function handleProxy(req: Request, res: Response) {
  const targetUrl = req.query.url as string;

  if (!targetUrl) {
    res.status(400).json({ error: 'Missing "url" query parameter' });
    return;
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsedTarget.protocol)) {
      res.status(400).json({ error: 'Invalid URL protocol' });
      return;
    }
  } catch {
    res.status(400).json({ error: 'Invalid URL' });
    return;
  }

  const controller = new AbortController();
  
  // Cleanly abort upstream request if client closes connection
  req.on('close', () => {
    try {
      controller.abort();
    } catch {
      // Ignore
    }
  });

  try {
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': req.headers['accept'] || '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `${parsedTarget.protocol}//${parsedTarget.host}/`,
      'Origin': `${parsedTarget.protocol}//${parsedTarget.host}`,
    };

    if (req.headers['range']) {
      headers['Range'] = req.headers['range'] as string;
    }

    // Strict 4.5s timeout on upstream connect/response to avoid long buffering freezes
    const timeoutSignal = AbortSignal.timeout(4500);
    const combinedSignal = AbortSignal.any([controller.signal, timeoutSignal]);

    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      signal: combinedSignal,
      redirect: 'follow',
    });

    // Set standard CORS and caching headers for the client
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    const contentType = upstreamRes.headers.get('content-type') || '';

    // Explicit segment check: Video/audio MIME types or chunk file extensions are NEVER manifests
    const isSegment =
      contentType.startsWith('video/') ||
      contentType.includes('video/mp2t') ||
      contentType.includes('video/mp4') ||
      contentType.includes('audio/mp4') ||
      contentType.includes('audio/aac') ||
      /\.(ts|m4s|mp4|aac|vtt|key)(\?|$)/i.test(targetUrl);

    const isM3U8 = !isSegment && (
      contentType.includes('application/vnd.apple.mpegurl') ||
      contentType.includes('application/x-mpegurl') ||
      contentType.includes('audio/x-mpegurl') ||
      /\.m3u8(\?|$)/i.test(targetUrl) ||
      (targetUrl.toLowerCase().includes('.smil') && !targetUrl.toLowerCase().includes('.ts'))
    );

    // Get final resolved URL after redirects
    const finalUrl = upstreamRes.url || targetUrl;

    if (isM3U8) {
      // If upstream failed with 4xx or 5xx error
      if (!upstreamRes.ok) {
        res.status(upstreamRes.status).json({
          error: 'Upstream manifest error',
          status: upstreamRes.status,
          targetUrl,
        });
        return;
      }

      const text = await upstreamRes.text();
      
      // If text doesn't look like an m3u8 playlist (e.g. ISP block page, HTML error page, Cloudflare challenge)
      if (!text.includes('#EXTM3U') && !text.includes('#EXTINF')) {
        // Fallback: If payload starts with MPEG-TS sync byte (0x47), it is a binary TS chunk misclassified as manifest
        if (text.charCodeAt(0) === 0x47) {
          res.setHeader('Content-Type', 'video/MP2T');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.status(upstreamRes.status).send(Buffer.from(text, 'binary'));
          return;
        }

        res.status(502).json({
          error: 'Upstream did not return a valid M3U8 manifest',
          status: upstreamRes.status,
          preview: text.slice(0, 150),
        });
        return;
      }

      const rewritten = rewriteM3U8(text, finalUrl);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(upstreamRes.status).send(rewritten);
      return;
    }

    // Binary / TS Segment streaming
    if (!upstreamRes.ok || contentType.includes('text/html')) {
      const denyReason = upstreamRes.headers.get('x-deny-reason') || '';
      res.setHeader('X-Stream-Denied', 'true');
      if (denyReason) res.setHeader('X-Deny-Reason', denyReason);
      res.status(upstreamRes.status >= 400 ? upstreamRes.status : 502).json({
        error: 'Segment unavailable or denied by upstream',
        status: upstreamRes.status,
        denyReason,
        targetUrl,
      });
      return;
    }

    res.status(upstreamRes.status);

    // Forward relevant headers
    if (upstreamRes.headers.has('content-type')) {
      res.setHeader('Content-Type', upstreamRes.headers.get('content-type')!);
    }
    if (upstreamRes.headers.has('content-length')) {
      res.setHeader('Content-Length', upstreamRes.headers.get('content-length')!);
    }
    if (upstreamRes.headers.has('content-range')) {
      res.setHeader('Content-Range', upstreamRes.headers.get('content-range')!);
    }
    if (upstreamRes.headers.has('accept-ranges')) {
      res.setHeader('Accept-Ranges', upstreamRes.headers.get('accept-ranges')!);
    }

    if (upstreamRes.body) {
      const nodeStream = Readable.fromWeb(upstreamRes.body as any);
      
      // Catch any premature client disconnects or abort errors without crashing process
      nodeStream.on('error', (err: any) => {
        if (err.name === 'AbortError' || err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
          return;
        }
        console.warn(`[Proxy Segment Stream Error] ${targetUrl}:`, err.message);
      });

      res.on('close', () => {
        try {
          nodeStream.destroy();
        } catch {
          // Ignore
        }
      });

      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err: any) {
    if (err.name === 'AbortError' && controller.signal.aborted) {
      // Client closed connection
      return;
    }
    if (err.name === 'TimeoutError' || (err.name === 'AbortError' && !controller.signal.aborted)) {
      console.warn(`[Proxy Timeout] ${targetUrl} (exceeded 4.5s)`);
      if (!res.headersSent) {
        res.status(504).json({ error: 'Upstream connection timed out', details: err.message });
      }
      return;
    }
    console.error(`[Proxy Error] ${targetUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy request failed', details: err.message });
    }
  }
}

function rewriteM3U8(content: string, baseUrl: string): string {
  const lines = content.split(/\r?\n/);
  const rewritten = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith('#')) {
      // Rewrite any embedded URIs, e.g. #EXT-X-KEY:METHOD=...,URI="..."
      // or #EXT-X-MEDIA:...URI="..." or #EXT-X-MAP:URI="..."
      return line.replace(/URI="([^"]+)"/g, (_, uri) => {
        try {
          const abs = new URL(uri, baseUrl).href;
          return `URI="/api/proxy?url=${encodeURIComponent(abs)}"`;
        } catch {
          return _;
        }
      });
    }

    // Line is a segment or sub-playlist URL
    try {
      const abs = new URL(trimmed, baseUrl).href;
      return `/api/proxy?url=${encodeURIComponent(abs)}`;
    } catch {
      return line;
    }
  });

  return rewritten.join('\n');
}
