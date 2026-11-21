import express from 'express';
import healthRoutes from './routes/health.routes.js';
import documentRoutes from './routes/document.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(pool) {
  const app = express();

  app.disable('x-powered-by');

  // CORS
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  // Attach pool to locals so controllers can access via req.app.locals.pool
  if (pool) {
    app.locals.pool = pool;
  }

  app.use('/api', healthRoutes);
  app.use('/api', documentRoutes);

  // 404 fallback for unmatched /api routes
  app.use('/api', (_request, response) => {
    response.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Không tìm thấy API.' },
    });
  });

  app.use(errorHandler);

  return app;
}
