import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDealDto {
  @ApiProperty({ example: 'Proposta ERP - Acme Corp' })
  @IsString()
  @MinLength(2)
  title: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  contactId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  pipelineId: string;

  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  stageId: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  value?: number;

  @ApiPropertyOptional({ example: 70, minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;
}
