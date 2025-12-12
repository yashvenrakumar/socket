import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response.util';
import { Logger } from '../utils/logger.util';

export class ErrorHandler {
  static handle(err: Error, _req: Request, res: Response, _next: NextFunction): void {
    Logger.error('Error occurred:', err);

    // Handle known error types
    if (err.name === 'ValidationError') {
      ResponseUtil.badRequest(res, 'Validation error', err.message);
      return;
    }

    if (err.name === 'UnauthorizedError') {
      ResponseUtil.unauthorized(res, err.message);
      return;
    }

    // Default error response
    ResponseUtil.error(
      res,
      process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      500,
      err.stack
    );
  }
}

export const errorHandler = ErrorHandler.handle;

