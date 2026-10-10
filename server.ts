import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import apiRouter from './server/routes.js';
import { ensureSeedAudioFiles } from './server/audioGenerator.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize seed audio files so playback works immediately
  const audioDir = path.resolve(process.cwd(), 'data', 'audio');
  ensureSeedAudioFiles(audioDir);

  // Parse JSON and form bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded artwork files
  const artworkDir = path.resolve(process.cwd(), 'data', 'artwork');
  app.use('/data/artwork', express.static(artworkDir));

  // Mount API endpoints
  app.use('/api', apiRouter);

  // In production, serve the built static client
  // In development, hook Vite's dev server middleware
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VibeVault Server] Running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[VibeVault Server] Startup error:', err);
  process.exit(1);
});
