import type { Request, Response, NextFunction } from 'express';

/** Wrap async controllers and forward errors to the global error handler. */
export const asyncHandler =
  <T extends Request = Request>(
    fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>,
  ) =>
  (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export interface ApiMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  [k: string]: unknown;
}

export interface ApiResponseBody<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: ApiMeta;
  error?: { code?: string; details?: unknown } | null;
}

export const ok = <T>(
  res: Response,
  data: T,
  message = 'OK',
  status = 200,
  meta?: ApiMeta,
): Response<ApiResponseBody<T>> =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const created = <T>(res: Response, data: T, message = 'Created'): Response =>
  ok(res, data, message, 201);

export const noContent = (res: Response): Response => res.status(204).send();
