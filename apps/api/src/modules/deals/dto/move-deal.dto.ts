import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class MoveDealDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  stageId: string;

  @ApiProperty({ example: 1.5, description: 'Fractional position within the stage' })
  @IsNumber()
  position: number;

  @ApiPropertyOptional({ description: 'Required when moving to a Won/Lost stage' })
  @IsOptional()
  @IsBoolean()
  isWon?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  closedReason?: string;
}
