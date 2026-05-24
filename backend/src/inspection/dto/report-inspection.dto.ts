import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReportInspectionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workerReport?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workerReportFiles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  damageReport?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
