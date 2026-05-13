import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantStorage } from '../tenant/tenant.context';
import { CurrentUserData } from '../decorators/current-user.decorator';

/**
 * Ensures the tenant context is populated from the authenticated user
 * for every request that passes JWT auth.
 */
@Injectable()
export class TenantScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserData | undefined;

    if (user?.tenantId) {
      return new Observable((subscriber) => {
        tenantStorage.run(
          { tenantId: user.tenantId as string, userId: user.sub, userRole: user.role },
          () => {
            next.handle().subscribe(subscriber);
          },
        );
      });
    }

    return next.handle();
  }
}
