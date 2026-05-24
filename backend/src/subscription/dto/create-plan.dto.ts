import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  monthlyPrice: number;

  @ApiProperty()
  @IsNumber()
  yearlyPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxProperties?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
