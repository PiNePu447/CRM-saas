import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Matches, MinLength } from 'class-validator';
import { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } from '../../auth/dto/register.dto';

// Roles assignable within a tenant — PLATFORM_ADMIN is excluded
// to prevent privilege escalation via the user invite endpoint
export enum TenantUserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  SELLER = 'SELLER',
}

export class InviteUserDto {
  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'maria@acmecorp.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: TenantUserRole, default: TenantUserRole.SELLER })
  @IsEnum(TenantUserRole)
  role: TenantUserRole;

  @ApiProperty({ example: 'TempPass@123', minLength: 8 })
  @IsString()
  @Matches(STRONG_PASSWORD_REGEX, { message: STRONG_PASSWORD_MESSAGE })
  temporaryPassword: string;

  @ApiPropertyOptional({ description: 'Manager ID to assign this seller to (only for SELLER role)' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}
