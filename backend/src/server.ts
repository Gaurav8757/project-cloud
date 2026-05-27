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
    // Use first CLIENT_URL for logging
    const primaryUrl = process.env.MY_URL || 'http://localhost';
    const clientHostname = new URL(primaryUrl).hostname;
    const protocol = env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${clientHostname}`;
    const apiUrl = `${baseUrl}${env.API_PREFIX}`;
    const docsUrl = `${baseUrl}/api/docs`;

    logger.info(`🚀 Project Cloud API ready`);
    logger.info(`   → ${baseUrl}`);
    logger.info(`   → API:    ${apiUrl}`);
    logger.info(`   → Docs:   ${docsUrl}`);
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
      // process.exit(1);
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
