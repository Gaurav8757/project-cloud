import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '../generated/prisma/client';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger';
import { isProd } from '../config/env';

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
  });
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown = undefined;
  let code: string | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = 'Validation failed';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    code = err.code;
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Unique constraint violation';
        details = err.meta;
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      default:
        statusCode = 400;
        message = `Database error (${err.code})`;
    }
  } else if (err instanceof jwt.TokenExpiredError) {
    statusCode = 401;
    message = 'Token expired';
  } else if (err instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  logger.error('Request failed', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    stack: !isProd && err instanceof Error ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: { code, details },
    ...(isProd
      ? {}
      : { stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5) : undefined }),
  });
};
