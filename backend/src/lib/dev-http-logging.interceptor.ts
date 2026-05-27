import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { createDevLogger, isDevLoggingEnabled, stringifyForDevLog } from './dev-logging.util';

@Injectable()
export class DevHttpLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!isDevLoggingEnabled() || context.getType() !== 'http') {
      return next.handle();
    }

    const logger = createDevLogger('DevHttpLoggingInterceptor');
    const request = context.switchToHttp().getRequest();
    const controllerName = context.getClass().name;
    const handlerName = context.getHandler().name;
    const startedAt = Date.now();

    logger.log(
      [
        `[Controller:${controllerName}] [Handler:${handlerName}] [HTTP:REQ] ${request.method} ${request.url}`,
        stringifyForDevLog({
          params: request.params,
          query: request.query,
          body: request.body,
          user: request.user
            ? {
                id: request.user.id,
                role: request.user.role,
                organizationId: request.user.organizationId ?? null,
                email: request.user.email,
              }
            : null,
        }),
      ].join('\n'),
    );

    return next.handle().pipe(
      tap({
        next: () => {},
        error: (error) => {
          logger.error(
            `[Controller:${controllerName}] [Handler:${handlerName}] [HTTP:ERR] status=${error?.status ?? 500} durationMs=${Date.now() - startedAt} message=${error?.message ?? 'Unknown error'}`,
          );
        },
      }),
    );
  }
}
