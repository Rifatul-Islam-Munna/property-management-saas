import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UnitStatus } from '../entities/unit.entity';

export class CreateUnitDto {
  @ApiProperty({ example: 'prop_xyz789' })
  @IsNotEmpty()
  @IsString()
  propertyId: string;

  @ApiProperty({ example: 'A-101' })
  @IsNotEmpty()
  @IsString()
  unitNumber: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  floor?: number;

  @ApiPropertyOptional({ example: '2bhk', description: 'e.g. studio, 1bhk, 2bhk, suite, office' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: UnitStatus, example: UnitStatus.VACANT, default: UnitStatus.VACANT })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;

  @ApiPropertyOptional({ example: 'tenant_abc123' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyRent?: number;

  @ApiPropertyOptional({ example: 850, description: 'Area in sq ft' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  area?: number;

  @ApiPropertyOptional({ example: 'Corner unit with balcony' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: ['https://cdn.example.com/unit1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ example: ['wifi', 'parking', 'gym'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
