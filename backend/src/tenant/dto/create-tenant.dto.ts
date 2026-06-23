import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TenantKind } from '../entities/tenant.entity';

export class EmergencyContactDto {
  @ApiPropertyOptional({ example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '01800000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Spouse' })
  @IsOptional()
  @IsString()
  relationship?: string;
}

export class CreateTenantDto {
  @ApiPropertyOptional({ enum: TenantKind, example: TenantKind.RENTER })
  @IsOptional()
  @IsEnum(TenantKind)
  tenantKind?: TenantKind;

  @ApiProperty({ example: 'property_abc123' })
  @IsNotEmpty()
  @IsString()
  propertyId: string;

  @ApiPropertyOptional({ example: 'unit_abc123' })
  @IsOptional()
  @IsString()
  unitId?: string;

  @ApiPropertyOptional({ example: 'user_abc123' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '01700000000' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/profile.jpg' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({ type: EmergencyContactDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ example: '123 Main St, Dhaka' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  leaseStart?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  leaseEnd?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  monthlyRent?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  rentDueDay?: number;

  @ApiPropertyOptional({ example: 30000 })
  @IsOptional()
  @IsNumber()
  securityDeposit?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsNumber()
  oneTimeGuestFee?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  guestFeePaid?: boolean;

  @ApiPropertyOptional({ example: ['https://cdn.example.com/doc1.pdf'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documents?: string[];

  @ApiPropertyOptional({ example: 'Preferred top floor' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  movedInAt?: string;

  @ApiPropertyOptional({ example: null })
  @IsOptional()
  @IsDateString()
  movedOutAt?: string;
}
