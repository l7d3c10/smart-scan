import express from 'express';
import healthRoutes from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', healthRoutes);
  app.use('/api', (_request, response) => {
    response.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Không tìm thấy API.' },
    });
  });
  app.use(errorHandler);

  return app;
}
