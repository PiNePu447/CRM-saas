import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUserData } from '../decorators/current-user.decorator';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    if (user?.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException('Access restricted to platform administrators');
    }

    return true;
  }
}
