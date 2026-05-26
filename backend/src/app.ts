import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { requestId, httpLogger } from './middlewares/logger.middleware';
import { sanitizeRequest } from './middlewares/sanitize.middleware';
import { generalLimiter } from './middlewares/rateLimit.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import routes from './routes';

export const buildApp = (): Application => {
  const app = express();

  // trust proxy for correct IPs behind nginx etc.
  app.set('trust proxy', 1);

  // security & infra
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());

  // observability
  app.use(requestId);
  app.use(httpLogger);

  // sanitization & rate limiting
  app.use(sanitizeRequest);
  app.use(env.API_PREFIX, generalLimiter);

  // docs
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Project Cloud API Docs',
    }),
  );
  app.get('/', (_req, res) =>
    res.json({
      name: 'Project Cloud API',
      version: '1.0.0',
      docs: '/api/docs',
      health: `${env.API_PREFIX}/health`,
    }),
  );

  // routes
  app.use(env.API_PREFIX, routes);

  // not found + errors
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default buildApp;
