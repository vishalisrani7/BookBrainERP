import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const errorObj = err instanceof Error ? err : new Error(String(err));
  logger.error(`Unhandled error at ${req.method} ${req.url}:`, errorObj);

  return res.status(500).json({
    success: false,
    error: errorObj.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: errorObj.stack }),
  });
}
