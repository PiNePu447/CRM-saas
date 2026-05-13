import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export interface CurrentUserData {
  sub: string;
  tenantId: string | null;
  role: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user as CurrentUserData;
    return data ? user?.[data] : user;
  },
);
