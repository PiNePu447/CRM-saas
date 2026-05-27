import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { TenantUserRole } from './invite-user.dto';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  // Restricted to tenant-level roles only — PLATFORM_ADMIN cannot be
  // assigned via this endpoint to prevent privilege escalation
  @ApiPropertyOptional({ enum: TenantUserRole })
  @IsOptional()
  @IsEnum(TenantUserRole)
  role?: TenantUserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Assign seller to a manager (null to unassign)' })
  @IsOptional()
  @IsUUID()
  managerId?: string;
}
