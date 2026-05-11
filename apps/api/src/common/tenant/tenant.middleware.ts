import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FastifyRequest, FastifyReply } from 'fastify';
import { tenantStorage } from './tenant.context';

interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  email: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: FastifyRequest['raw'], res: FastifyReply['raw'], next: () => void) {
    const authHeader = (req as { headers: Record<string, string> }).headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice(7);

    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: process.env.JWT_SECRET,
      });

      tenantStorage.run(
        { tenantId: payload.tenantId, userId: payload.sub, userRole: payload.role },
        () => next(),
      );
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
