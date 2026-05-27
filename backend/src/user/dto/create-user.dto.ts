import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsEmail,
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { OwnerProfileType, UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '01700000000' })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'org_abc123' })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({ example: 'Property Manager' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: ['property_1'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  propertyIds?: string[];

  @ApiProperty({ example: 'StrongPass123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    enum: UserRole,
    example: UserRole.GUEST,
    default: UserRole.GUEST,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    enum: OwnerProfileType,
    example: OwnerProfileType.MANAGER,
  })
  @IsOptional()
  @IsEnum(OwnerProfileType)
  ownerProfileType?: OwnerProfileType;
}
