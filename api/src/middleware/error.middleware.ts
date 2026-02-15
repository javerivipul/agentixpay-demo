import { Request, Response, NextFunction } from 'express';
import { AgentixError, logger } from '@agentix/core';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;

  if (err instanceof AgentixError) {
    logger.warn({
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      message: err.message,
    }, 'Request error');

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  logger.error({
    requestId,
    path: req.path,
    error: err.message,
    stack: err.stack,
  }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
