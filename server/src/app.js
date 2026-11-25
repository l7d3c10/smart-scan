import express from 'express';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes.js';
import documentRoutes from './routes/document.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import statsRoutes from './routes/stats.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createSessionMiddleware } from './middleware/session.js';
import { csrfProtection } from './middleware/csrf.js';

export function createApp(pool, config = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({
    strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        formAction: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
  }));

  // CORS
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', config.clientOrigin || 'http://localhost:5173');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '600');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  // Attach pool to locals so controllers can access via req.app.locals.pool
  if (pool) {
    app.locals.pool = pool;
  }
  if (config.storageRoot) app.locals.storageRoot = config.storageRoot;
  if (config.pythonExecutable) app.locals.pythonExecutable = config.pythonExecutable;

  if (pool && config.sessionSecret) {
    app.use(createSessionMiddleware(pool, config.sessionSecret));
    app.use(csrfProtection);
  }

  app.use('/api', authRoutes);
  app.use('/api', adminRoutes);
  app.use('/api', uploadRoutes);
  app.use('/api', statsRoutes);
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
