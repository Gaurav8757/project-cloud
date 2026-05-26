import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/crypto';
import { UnauthorizedError } from '../utils/AppError';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is required');
    }
    const token = header.slice('Bearer '.length).trim();
    if (!token) throw new UnauthorizedError('Authentication token is required');

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

/** Soft auth — attach user if present but don't fail when missing. */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.slice('Bearer '.length).trim();
      if (token) req.user = verifyAccessToken(token);
    }
  } catch {
    /* ignore */
  }
  next();
};
