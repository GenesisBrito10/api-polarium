import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now();
    this.logger.log(`Request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const status = res?.statusCode;
        const delay = Date.now() - now;
        this.logger.log(`Response: ${method} ${url} ${status} +${delay}ms`);
      }),
      catchError((err) => {
        const res = context.switchToHttp().getResponse();
        const status = res?.statusCode;
        const delay = Date.now() - now;
        this.logger.error(
          `Error: ${method} ${url} ${status} +${delay}ms - ${err instanceof Error ? err.message : err}`,
        );
        throw err;
      }),
    );
  }
}
