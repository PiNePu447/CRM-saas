import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DealsService } from '../deals/deals.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly dealsService: DealsService,
  ) {}

  async register(dto: RegisterDto) {
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.tenantName,
        slug: dto.tenantSlug,
        users: {
          create: {
            email: dto.email,
            passwordHash,
            name: dto.name,
            role: 'ADMIN',
          },
        },
      },
      include: { users: true },
    });

    await this.dealsService.seedDefaultPipeline(tenant.id);

    const user = tenant.users[0];
    const tokens = await this.generateTokens(user.id, tenant.id, user.role, user.email);

    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, isActive: true, deletedAt: null },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.tenantId, user.role, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      tenant: user.tenant
        ? { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug }
        : null,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        tenantId: string | null;
        role: string;
        email: string;
      }>(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });

      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, isActive: true, deletedAt: null },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Refresh token invalid');
      }

      const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!tokenMatches) {
        throw new UnauthorizedException('Refresh token mismatch');
      }

      const tokens = await this.generateTokens(user.id, user.tenantId, user.role, user.email);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async getProfile(userId: string, tenantId: string | null) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, ...(tenantId ? { tenantId } : {}), deletedAt: null },
      include: { tenant: { select: { id: true, name: true, slug: true, settings: true } } },
    });

    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      tenant: user.tenant ?? null,
    };
  }

  private async generateTokens(userId: string, tenantId: string | null, role: string, email: string) {
    const payload = { sub: userId, tenantId, role, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { refreshToken: hashed } });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
