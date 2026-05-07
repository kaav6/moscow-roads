import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@moscow-roads.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Passw0rd!' })
  @IsString()
  @MinLength(6)
  password!: string;
}
