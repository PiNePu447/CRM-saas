import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Acme Corp Updated' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Soft-delete the tenant' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
