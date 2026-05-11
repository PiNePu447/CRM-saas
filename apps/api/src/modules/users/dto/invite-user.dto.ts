import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class InviteUserDto {
  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'maria@acmecorp.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserRole, default: UserRole.SELLER })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'TempPass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  temporaryPassword: string;
}
