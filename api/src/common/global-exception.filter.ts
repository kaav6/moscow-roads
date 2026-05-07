import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const requestId = (req as any).requestId ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal error';
    let detail: string | undefined;
    let errors: { path: string; message: string }[] | undefined;
    let type = 'https://moscow-roads.local/errors/internal';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();
      if (typeof raw === 'string') {
        title = raw;
      } else if (typeof raw === 'object' && raw) {
        const obj = raw as Record<string, any>;
        title = obj.error ?? obj.message ?? exception.message;
        detail = Array.isArray(obj.message) ? obj.message.join('; ') : obj.message;
        if (Array.isArray(obj.message)) {
          errors = obj.message.map((m: string) => ({ path: '', message: m }));
        }
      }
      type = `https://moscow-roads.local/errors/${status}`;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        title = 'Not found';
        detail = exception.message;
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        title = 'Conflict';
        detail = 'Unique constraint violation';
      } else {
        status = HttpStatus.BAD_REQUEST;
        title = 'Database request error';
        detail = exception.code;
      }
      type = `https://moscow-roads.local/errors/db/${exception.code}`;
    } else if (exception instanceof Error) {
      title = exception.message;
      this.logger.error(exception.stack);
    }

    res
      .status(status)
      .header('X-Request-Id', String(requestId))
      .json({
        type,
        title,
        status,
        detail,
        instance: req.originalUrl,
        errors,
        requestId,
      });
  }
}
