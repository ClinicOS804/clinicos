import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler — must be registered LAST in Express middleware chain.
 * Returns consistent JSON error responses to the frontend.
 */
export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Validation error from Zod
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Known application error
  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? 'SERVER_ERROR';
  const message = err.message ?? 'An unexpected error occurred';

  // Only log 5xx errors — 4xx are expected (bad input etc.)
  if (statusCode >= 500) {
    logger.error({
      message,
      code,
      stack: err.stack,
      url: req.url,
      method: req.method,
      clinicId: req.clinicId,
    });
  }

  res.status(statusCode).json({
    error: message,
    code,
    statusCode,
  });
}

/** Helper to create typed AppErrors with status codes */
export function createError(message: string, statusCode: number, code: string): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
