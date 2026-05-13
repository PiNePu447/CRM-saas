import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ServerResponse } from 'http';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    if (host.getType() !== 'http') {
      this.logger.error(
        'Exception in non-HTTP context',
        exception instanceof Error ? exception.stack : String(exception),
      );
      return;
    }

    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'object' ? message : { error: message },
    };

    // TenantMiddleware uses raw Node.js req/res — FastifyReply methods not available
    if (typeof (reply as unknown as FastifyReply).code === 'function') {
      await (reply as unknown as FastifyReply).code(status).send(errorResponse);
    } else {
      const raw = reply as unknown as ServerResponse;
      raw.writeHead(status, { 'Content-Type': 'application/json' });
      raw.end(JSON.stringify(errorResponse));
    }
  }
}
