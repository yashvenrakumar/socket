import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

export class ResponseUtil {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string = 'Error occurred',
    statusCode: number = 500,
    error?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error: error || message,
      statusCode,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * Send not found response
   */
  static notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, message, 404);
  }

  /**
   * Send bad request response
   */
  static badRequest(res: Response, message: string = 'Bad request', error?: string): Response {
    return this.error(res, message, 400, error);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden response
   */
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, 403);
  }
}

