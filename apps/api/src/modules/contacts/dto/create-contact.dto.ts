import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactStatus } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'joao@empresa.com' })
  @ValidateIf((o) => !o.phone || o.email)
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiPropertyOptional({ example: '+55 11 99999-9999' })
  @ValidateIf((o) => !o.email || o.phone)
  @IsString({ message: 'Telefone inválido' })
  phone?: string;

  @ApiPropertyOptional({ example: '1990-05-13', description: 'Data de nascimento (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ enum: ContactStatus, default: ContactStatus.LEAD })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsUUID('all', { each: true })
  tagIds?: string[];
}
