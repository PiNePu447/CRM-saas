import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  tenantId: string | null;
  role: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET environment variable is not set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: payload.sub,
        ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
        isActive: true,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };
  }
}
