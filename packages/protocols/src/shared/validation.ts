import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Express middleware that validates req.query against a Zod schema.
 * Parsed result is assigned back to req.query.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json(formatZodError(result.error));
    }
    req.query = result.data as typeof req.query;
    next();
  };
}

/**
 * Express middleware that validates req.body against a Zod schema.
 * Parsed result is assigned back to req.body.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(formatZodError(result.error));
    }
    req.body = result.data;
    next();
  };
}

function formatZodError(error: ZodError) {
  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    },
  };
}
