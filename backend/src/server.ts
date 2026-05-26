import 'dotenv/config';
import http from 'http';
import { buildApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { initSocket } from './sockets';
import { prisma } from './config/prisma';

const startServer = async (): Promise<void> => {
  const app = buildApp();
  const server = http.createServer(app);

  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`🚀 Project Cloud API ready`);
    logger.info(`   → http://localhost:${env.PORT}`);
    logger.info(`   → API:    http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`   → Docs:   http://localhost:${env.PORT}/api/docs`);
    logger.info(`   → Env:    ${env.NODE_ENV}`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('HTTP server & DB disconnected. Bye 👋');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forcing shutdown after 10s');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason });
  });
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { err });
    void shutdown('uncaughtException');
  });
};

void startServer();
