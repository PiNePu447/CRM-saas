import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSuperAdminDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'joao@acmecorp.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass@123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
