import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsObject, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'acme-corp' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must contain only lowercase letters, numbers and hyphens' })
  @MinLength(2)
  @MaxLength(50)
  slug: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiProperty({ example: 'admin@acmecorp.com', description: 'Email for the initial SUPER_ADMIN user' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'StrongPass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  adminPassword: string;

  @ApiProperty({ example: 'João Silva', description: 'Name of the initial SUPER_ADMIN user' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  adminName: string;
}
