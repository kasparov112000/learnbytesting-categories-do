import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || exception.message;
      errorName = exception.name;
    } else if (exception instanceof Error) {
      // Map legacy error names to HTTP status codes (matching old handleErrorResponse)
      switch (exception.name) {
        case 'ValidationError':
          status = HttpStatus.BAD_REQUEST;
          break;
        case 'UnauthorizedException':
          status = HttpStatus.UNAUTHORIZED;
          break;
        case 'NotFoundException':
          status = HttpStatus.NOT_FOUND;
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
      message = exception.message;
      errorName = exception.name;
    }

    this.logger.error(`${errorName}: ${message}`, exception instanceof Error ? exception.stack : '');

    response.status(status).json({
      statusCode: status,
      message,
      error: errorName,
      timestamp: new Date().toISOString(),
    });
  }
}
