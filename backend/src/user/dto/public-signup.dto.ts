import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class PublicSignupDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '01700000000' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'Property Manager' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    enum: [UserRole.WORKER, UserRole.TETENTWONER],
    example: UserRole.WORKER,
  })
  @IsEnum(UserRole)
  role: UserRole.WORKER | UserRole.TETENTWONER;
}
