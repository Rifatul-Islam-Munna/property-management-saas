import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { RecurringReportStatus } from '../entities/recurring-maintenance.entity';

export class ReportRecurringMaintenanceDto {
  @ApiPropertyOptional({ enum: RecurringReportStatus })
  @IsOptional()
  @IsEnum(RecurringReportStatus)
  status?: RecurringReportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  files?: string[];

  @ApiPropertyOptional({ example: 55 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({ example: 'usd' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'paid' })
  @IsOptional()
  @IsString()
  paymentStatus?: string;
}
