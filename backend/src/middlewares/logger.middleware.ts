import type { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import { logger } from '../config/logger';

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const id = (req.headers['x-request-id'] as string) || nanoid(12);
  req.requestId = id;
  res.setHeader('x-request-id', id);
  next();
};

const stream = { write: (msg: string) => logger.http(msg.trim()) };

morgan.token('id', (req: Request) => req.requestId || '-');

export const httpLogger = morgan(
  ':id :method :url :status :res[content-length] - :response-time ms',
  { stream },
);
