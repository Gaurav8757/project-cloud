import type { Request, Response, NextFunction } from 'express';
import xss from 'xss';

const sanitize = (value: unknown): unknown => {
  if (typeof value === 'string') return xss(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitize(v);
    return out;
  }
  return value;
};

export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) req.body = sanitize(req.body);
  if (req.params) req.params = sanitize(req.params) as Record<string, string>;
  // query is read-only in Express 5; copy-merge instead of reassign
  if (req.query) {
    const cleaned = sanitize(req.query) as Record<string, unknown>;
    for (const k of Object.keys(cleaned)) {
      (req.query as Record<string, unknown>)[k] = cleaned[k];
    }
  }
  next();
};
