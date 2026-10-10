import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './server/app.js';

async function startServer() {
  const app = createExpressApp();
  const PORT = 3000;

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
