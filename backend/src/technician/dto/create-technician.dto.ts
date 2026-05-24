import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TechnicianAvailability } from '../entities/technician.entity';

export class CreateTechnicianDto {
  @ApiPropertyOptional({ example: '6650dc1f31d889f2435b2a11' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 'John Smith' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john.smith@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1-555-0199' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: ['plumbing', 'electrical', 'hvac'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    enum: TechnicianAvailability,
    example: TechnicianAvailability.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(TechnicianAvailability)
  availability?: TechnicianAvailability;

  @ApiPropertyOptional({ example: ['property_1', 'property_2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedProperties?: string[];

  @ApiPropertyOptional({ example: 45.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: 'Specializes in emergency repairs' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-01-15T00:00:00.000Z' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  joinedAt?: Date;
}
