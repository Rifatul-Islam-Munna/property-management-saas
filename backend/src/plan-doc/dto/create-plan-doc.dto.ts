import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PlanDocAccess } from '../entities/plan-doc.entity';

class PlanViewportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  x?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  y?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  zoom?: number;
}

class PlanShareDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ enum: PlanDocAccess })
  @IsOptional()
  @IsEnum(PlanDocAccess)
  access?: PlanDocAccess;
}

export class CreatePlanDocDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  nodes?: Record<string, unknown>[];

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  edges?: Record<string, unknown>[];

  @ApiPropertyOptional({ type: PlanViewportDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlanViewportDto)
  viewport?: PlanViewportDto;

  @ApiPropertyOptional({ type: [PlanShareDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanShareDto)
  sharedWith?: PlanShareDto[];
}
