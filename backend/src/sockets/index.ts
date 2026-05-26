import { Server as SocketIOServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { env } from '../config/env';
import { verifyAccessToken } from '../utils/crypto';
import { logger } from '../config/logger';
import { SOCKET_EVENTS } from '../constants';
import { prisma } from '../config/prisma';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  // Auth handshake middleware
  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers.authorization as string | undefined)?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication token missing'));
      const payload = verifyAccessToken(token);
      (socket.data as { userId: string }).userId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket.data as { userId: string }).userId;
    logger.info('Socket connected', { userId, socketId: socket.id });

    // Personal room for direct notifications
    socket.join(`user:${userId}`);

    socket.on(SOCKET_EVENTS.JOIN_PROJECT, async (projectId: string) => {
      const ok = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        select: { id: true },
      });
      if (ok) socket.join(`project:${projectId}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_PROJECT, (projectId: string) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { userId, socketId: socket.id });
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => io;
