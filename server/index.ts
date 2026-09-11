import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { fetchPlaylist, DEFAULT_PLAYLIST_URL } from './playlist.js';
import { handleProxy } from './proxy.js';
import { resolveYouTubeVideoId } from './resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3001);

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// Playlist API
app.get('/api/playlist', async (req, res) => {
  const url = (req.query.url as string) || DEFAULT_PLAYLIST_URL;
  const reload = req.query.reload === 'true';

  try {
    const data = await fetchPlaylist(url, reload);
    res.json(data);
  } catch (err: any) {
    console.error('[Playlist Error]:', err.message);
    res.status(500).json({ error: 'Failed to fetch or parse playlist', details: err.message });
  }
});

// Streaming Proxy
app.get('/api/proxy', handleProxy);
app.head('/api/proxy', handleProxy);

// Stream & Video Resolver (for YouTube live channels, etc.)
app.get('/api/resolve', async (req, res) => {
  const url = req.query.url as string;
  if (!url) {
    res.status(400).json({ error: 'Missing url query parameter' });
    return;
  }

  try {
    const result = await resolveYouTubeVideoId(url);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to resolve video', details: err.message });
  }
});

// Serve client in production
const clientDist = path.resolve(__dirname, '../client');
const clientDistAlt = path.resolve(__dirname, '../../dist/client');
const staticPath = fs.existsSync(clientDist) ? clientDist : (fs.existsSync(clientDistAlt) ? clientDistAlt : null);

if (staticPath) {
  console.log(`[Server] Serving static client from ${staticPath}`);
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(staticPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`
  ===========================================
    OpenIPTV Backend Running!
    URL: http://localhost:${PORT}
    Playlist API: http://localhost:${PORT}/api/playlist
    Proxy API:    http://localhost:${PORT}/api/proxy?url=...
  ===========================================
  `);
});
