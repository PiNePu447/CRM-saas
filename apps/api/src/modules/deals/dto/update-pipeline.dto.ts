import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class UpdatePipelineDto {
  @ApiPropertyOptional({ example: 'Vendas' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateStageDto {
  @ApiPropertyOptional({ example: 'Qualificação' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probabilityDefault?: number;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class CreateStageInPipelineDto {
  @ApiPropertyOptional({ example: 'Novo Estágio' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probabilityDefault?: number;

  @ApiPropertyOptional({ example: '#6B7280' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}

export class ReorderStagesDto {
  @ApiPropertyOptional({ type: [String], description: 'Stage IDs in the desired order' })
  @IsArray()
  @IsUUID('4', { each: true })
  stageIds: string[];
}
