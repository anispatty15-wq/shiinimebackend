import type { NextFunction, Request, Response } from 'express';

export type ApiError = Error & { statusCode?: number; code?: string };

export const sendError = (res: Response, statusCode: number, code: string, message: string) => {
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  sendError(res, 404, 'NOT_FOUND', 'Route not found');
};

export const globalErrorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = statusCode === 500 ? 'Internal server error' : err.message || 'Request failed';

  sendError(res, statusCode, code, message);
};
