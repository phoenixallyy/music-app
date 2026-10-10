import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import apiRouter from './routes.js';
import { ensureSeedAudioFiles } from './audioGenerator.js';

export function createExpressApp() {
  const app = express();

  // Initialize seed audio files so playback works immediately
  const audioDir = path.resolve(process.cwd(), 'data', 'audio');
  ensureSeedAudioFiles(audioDir);

  // CORS and Preflight Handling for Vercel & Preview environments
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Parse JSON and form bodies
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded artwork files
  const artworkDir = path.resolve(process.cwd(), 'data', 'artwork');
  app.use('/data/artwork', express.static(artworkDir));

  // Mount API endpoints:
  // Mount at both /api and root so routes match whether the host/rewrite retains or strips '/api'
  app.use('/api', apiRouter);
  app.use(apiRouter);

  return app;
}
